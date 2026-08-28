// Ser Dono — Edge Function "assinatura-criar-checkout" (cobrança via
// AbacatePay, pedido do dono do produto, 17/08/2026).
//
// Cria (ou reaproveita) o customer da AbacatePay do usuário e o checkout de
// assinatura recorrente, devolve a URL pra redirecionar (RN-17/RNF-8: o
// checkout nasce sempre na web — o client, seja app ou site, só abre essa
// URL num navegador, nunca cobra dentro do app).
//
// Precisa de service_role (como enviar-email-boas-vindas, SDD-70): grava em
// `subscriptions`, que não tem policy de insert pro client (só o webhook e
// esta function, ambos service_role, escrevem lá).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY")!;

const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

const PRODUTO_POR_PLANO: Record<string, string | undefined> = {
  essencial: Deno.env.get("ABACATEPAY_PRODUTO_ESSENCIAL"),
  master: Deno.env.get("ABACATEPAY_PRODUTO_MASTER"),
};

// Preço de lançamento (packages/core/planos.ts::PLANOS_CATALOGO) — duplicado
// aqui pelo mesmo motivo de sempre: Edge Function não importa @serdono/core.
const PRECO_CENTAVOS_POR_PLANO: Record<string, number> = { essencial: 1990, master: 3990 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth, error: authError } = await asUser.auth.getUser();
    if (authError || !auth?.user) return json({ error: "Sessão inválida." }, 401);
    const user = auth.user;
    if (!user.email) return json({ error: "Sua conta precisa de um e-mail antes de assinar." }, 400);

    const body = await req.json().catch(() => null);
    const plano = body?.plano;
    if (plano !== "essencial" && plano !== "master") {
      return json({ error: "Campo 'plano' precisa ser 'essencial' ou 'master'." }, 400);
    }
    // Cupom é opcional — a AbacatePay só mostra o campo de cupom na página de
    // checkout se o código estiver na lista `coupons` enviada na criação
    // (achado lendo a doc de `subscriptions/create`: sem isso, o campo nem
    // aparece pro cliente digitar). Não valida aqui se o cupom existe/está
    // ativo — a própria AbacatePay recusa na hora de aplicar, no checkout.
    const cupom = typeof body?.cupom === "string" ? body.cupom.trim() : undefined;

    // App instalado (Android/iOS) manda um deep link próprio (`serdono://...`,
    // `Linking.createURL` no client) em vez do destino web padrão — pedido do
    // dono do produto, 28/08/2026: sem isso, o app Android abria o checkout
    // num navegador in-app e, ao terminar o pagamento, ficava preso mostrando
    // o SITE (serdono.com.br), sem sessão nenhuma aí — o usuário tinha que
    // fechar a aba manualmente pra voltar ao app de verdade. Com o deep link,
    // `WebBrowser.openAuthSessionAsync` (PlanosScreen.tsx) detecta o retorno e
    // fecha a aba sozinho, devolvendo o controle pro app.
    //
    // Validação simples (só aceita nosso próprio domínio/esquema) — o valor
    // vem de um usuário autenticado, mas só vira parâmetro passado adiante
    // pra AbacatePay, sem efeito colateral no nosso lado; ainda assim não faz
    // sentido aceitar redirecionar o fim do checkout pra um destino arbitrário.
    function validarRedirect(v: unknown, padrao: string): string {
      if (typeof v === "string" && (v.startsWith("serdono://") || v.startsWith(BASE_URL))) return v;
      return padrao;
    }
    const completionUrl = validarRedirect(body?.completionUrl, `${BASE_URL}/assinatura`);
    const returnUrl = validarRedirect(body?.returnUrl, `${BASE_URL}/planos`);

    const produtoId = PRODUTO_POR_PLANO[plano];
    if (!produtoId) {
      console.error(`Produto AbacatePay não configurado pro plano ${plano}`);
      return json({ error: "Assinatura temporariamente indisponível — tente de novo em instantes." }, 500);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Reaproveita o customerId da AbacatePay se o usuário já tiver uma
    // assinatura anterior (mesmo cliente, evita duplicar cadastro na AbacatePay).
    const { data: assinaturaAnterior } = await admin
      .from("subscriptions")
      .select("abacatepay_customer_id")
      .eq("user_id", user.id)
      .not("abacatepay_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = assinaturaAnterior?.abacatepay_customer_id as string | undefined;

    if (!customerId) {
      const { data: perfil } = await admin.from("users").select("nome").eq("id", user.id).maybeSingle();
      const respCustomer = await fetch("https://api.abacatepay.com/v2/customers/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: (perfil?.nome as string) || undefined }),
      });
      const bodyCustomer = await respCustomer.json();
      if (!respCustomer.ok || !bodyCustomer?.data?.id) {
        console.error("AbacatePay customers/create falhou", respCustomer.status, bodyCustomer);
        return json({ error: "Não foi possível iniciar a assinatura agora. Tente de novo em instantes." }, 502);
      }
      customerId = bodyCustomer.data.id as string;
    }

    const externalId = `${user.id}:${plano}:${Date.now()}`;

    const respCheckout = await fetch("https://api.abacatepay.com/v2/subscriptions/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: produtoId, quantity: 1 }],
        customerId,
        externalId,
        methods: ["CARD"],
        completionUrl,
        returnUrl,
        ...(cupom ? { coupons: [cupom] } : {}),
      }),
    });
    const bodyCheckout = await respCheckout.json();
    if (!respCheckout.ok || !bodyCheckout?.data?.url) {
      console.error("AbacatePay subscriptions/create falhou", respCheckout.status, bodyCheckout);
      return json({ error: "Não foi possível iniciar a assinatura agora. Tente de novo em instantes." }, 502);
    }

    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      plano,
      status: "pendente",
      preco_centavos: PRECO_CENTAVOS_POR_PLANO[plano],
      abacatepay_customer_id: customerId,
      abacatepay_billing_id: bodyCheckout.data.id,
      abacatepay_external_id: externalId,
    });
    if (insertError) throw insertError;

    return json({ checkoutUrl: bodyCheckout.data.url });
  } catch (error) {
    console.error("assinatura-criar-checkout", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
