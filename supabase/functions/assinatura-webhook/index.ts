// Ser Dono — Edge Function "assinatura-webhook" (cobrança via AbacatePay,
// pedido do dono do produto, 17/08/2026).
//
// PRIMEIRA function deste tipo no projeto: recebe uma chamada de fora
// (AbacatePay), não do client autenticado. Sem JWT do Supabase — autentica
// via `webhookSecret` na query string (mesmo mecanismo documentado pela
// AbacatePay: https://docs.abacatepay.com/pages/webhooks). Deploy precisa
// ser feito com `verify_jwt: false`.
//
// Fonte de verdade de `subscriptions.status`/`users.plano_atual` — nunca o
// client escreve isso diretamente (RLS não tem policy de insert/update pro
// usuário nessa tabela).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { assuntoPlanoAtivado, htmlPlanoAtivado, textoPlanoAtivado, type DadosEmailPlanoAtivado } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("EMAIL_FROM") ?? "Mary do Ser Dono <mary@serdono.com.br>";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? "contato@serdono.com.br";
const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * E-mail de "plano ativado/trocado" (pedido do dono do produto, 28/08/2026)
 * — dispara na hora que a AbacatePay confirma o pagamento, mostrando valor
 * pago, data, boas-vindas ao plano novo e o link de acesso. Nunca derruba o
 * webhook se falhar (mesmo raciocínio de "best-effort" já usado em SDD-119
 * pra capa de produto): erro de e-mail é logado, a resposta pra AbacatePay
 * continua `200` — o dado que importa de verdade (`subscriptions`/
 * `users.plano_atual`) já foi gravado antes desta função ser chamada.
 */
async function enviarEmailPlanoAtivado(
  admin: ReturnType<typeof createClient>,
  subscription: { id: string; user_id: string; plano: string },
  precoCentavos: number,
  dataPagamento: string
) {
  try {
    if (subscription.plano !== "essencial" && subscription.plano !== "master") return;

    const [{ data: authUser }, { data: perfil }, { count: outrasAssinaturas }] = await Promise.all([
      admin.auth.admin.getUserById(subscription.user_id),
      admin.from("users").select("nome").eq("id", subscription.user_id).maybeSingle(),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", subscription.user_id).neq("id", subscription.id),
    ]);

    const email = authUser?.user?.email;
    if (!email) {
      console.warn("assinatura-webhook: sem e-mail pra enviar confirmação de plano", { user_id: subscription.user_id });
      return;
    }

    const dados: DadosEmailPlanoAtivado = {
      nome: (perfil?.nome as string) ?? "",
      email,
      plano: subscription.plano,
      precoCentavos,
      dataPagamento,
      trocaDePlano: (outrasAssinaturas ?? 0) > 0,
      baseUrl: BASE_URL,
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: REPLY_TO,
        subject: assuntoPlanoAtivado(dados),
        html: htmlPlanoAtivado(dados),
        text: textoPlanoAtivado(dados),
      }),
    });
    if (!resp.ok) {
      console.error("assinatura-webhook: Resend falhou no e-mail de plano ativado", resp.status, await resp.text());
    }
  } catch (error) {
    console.error("assinatura-webhook: erro enviando e-mail de plano ativado", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const secretRecebido = url.searchParams.get("webhookSecret");
    if (!WEBHOOK_SECRET || secretRecebido !== WEBHOOK_SECRET) {
      return json({ error: "Não autorizado." }, 401);
    }

    const payload = await req.json().catch(() => null);
    const evento = payload?.event as string | undefined;
    const data = payload?.data;
    if (!evento || !data) return json({ error: "Payload inválido." }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Acha a linha pela referência que a própria function de checkout gravou —
    // billing_id primeiro (mais específico), externalId como reforço.
    //
    // Achado testando um pagamento real (28/08/2026): o payload de verdade
    // aninha os campos em `data.billing.*` (mesmo formato documentado pra
    // `billing.paid` em docs.abacatepay.com/llms-full.txt — `data.id`/
    // `data.externalId` direto na raiz, que o código assumia antes, NUNCA
    // existiu). Resultado: todo evento real caía em "nenhuma subscription
    // encontrada" e `subscriptions`/`users.plano_atual` nunca atualizavam,
    // mesmo com o webhook cadastrado certo (SDD-121) e retornando 200 (a
    // AbacatePay não reenvia um webhook que respondeu 2xx). `data.subscription.*`
    // entra como segundo fallback (não confirmado num payload real ainda,
    // mas é a forma mais provável pra um evento de `subscription.*`) antes
    // dos campos na raiz, que ficam só como último fallback por segurança.
    const billingId = (data.billing?.id ?? data.subscription?.id ?? data.id ?? data.billingId) as string | undefined;
    const externalId = (data.billing?.externalId ?? data.subscription?.externalId ?? data.externalId) as string | undefined;

    async function acharSubscription() {
      if (billingId) {
        const { data: row } = await admin.from("subscriptions").select("*").eq("abacatepay_billing_id", billingId).maybeSingle();
        if (row) return row;
      }
      if (externalId) {
        const { data: row } = await admin.from("subscriptions").select("*").eq("abacatepay_external_id", externalId).maybeSingle();
        if (row) return row;
      }
      return null;
    }

    const subscription = await acharSubscription();
    if (!subscription) {
      // Evento de algo que não veio desta integração (ex.: outro projeto na
      // mesma conta AbacatePay) — responde 200 pra AbacatePay não ficar
      // reenviando, mas não altera nada.
      console.warn("assinatura-webhook: nenhuma subscription encontrada", { evento, billingId, externalId, data: JSON.stringify(data) });
      return json({ ignorado: true });
    }

    const agora = new Date().toISOString();

    if (evento === "subscription.completed" || evento === "subscription.renewed") {
      // Guarda de idempotência do e-mail: só a PRIMEIRA vez que esta linha
      // ativa (nunca teve `iniciado_em`) conta como "acabou de assinar/trocar
      // de plano". Reentrega do mesmo evento (`iniciado_em` já preenchido) ou
      // uma renovação mensal de verdade não disparam um e-mail novo de boas-
      // vindas ao plano — só a ativação inicial desta assinatura.
      const primeiraAtivacao = !subscription.iniciado_em;
      await admin
        .from("subscriptions")
        .update({
          status: "ativa",
          iniciado_em: subscription.iniciado_em ?? agora,
          renovado_em: agora,
          // Zera a marca de inadimplência (`assinatura-verificar-vencidas`) —
          // pagamento confirmado de novo, mesmo que tenha sido um retry
          // tardio da própria AbacatePay na MESMA cobrança depois do
          // rebaixamento automático. Sem isso, o próximo ciclo herdaria uma
          // data de inadimplência de um episódio já resolvido.
          inadimplente_desde: null,
          updated_at: agora,
        })
        .eq("id", subscription.id);
      await admin.from("users").update({ plano_atual: subscription.plano }).eq("id", subscription.user_id);

      if (primeiraAtivacao) {
        await enviarEmailPlanoAtivado(admin, subscription, subscription.preco_centavos, agora);
      }
    } else if (evento === "subscription.cancelled") {
      await admin
        .from("subscriptions")
        .update({ status: "cancelada", cancelado_em: agora, updated_at: agora })
        .eq("id", subscription.id);
      // Só rebaixa pra gratuito se não houver OUTRA assinatura ativa (ex.: trocou de plano).
      const { data: outraAtiva } = await admin
        .from("subscriptions")
        .select("plano")
        .eq("user_id", subscription.user_id)
        .eq("status", "ativa")
        .neq("id", subscription.id)
        .maybeSingle();
      await admin.from("users").update({ plano_atual: outraAtiva?.plano ?? "gratuito" }).eq("id", subscription.user_id);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("assinatura-webhook", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
