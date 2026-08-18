// Ser Dono — Edge Function "admin-abacatepay-proxy" (Painel Admin AbacatePay,
// pedido do dono do produto, 18/08/2026).
//
// Um proxy genérico em vez de uma function por endpoint (a API da AbacatePay
// tem 45 endpoints documentados em 12 categorias — uma function por endpoint
// seria 45 arquivos quase idênticos). O client nunca vê `ABACATEPAY_API_KEY`;
// manda `{ method, path, query?, body? }`, esta function valida `path` contra
// um ALLOWLIST fechado (nunca repassa path arbitrário — mesmo sendo admin,
// ninguém deveria conseguir bater num endpoint da AbacatePay que este painel
// não conhece) e injeta o Bearer token só no lado do servidor.
//
// Fora do allowlist de propósito (achado ao levantar a API antes de
// codificar, `docs.abacatepay.com/llms.txt`): Payment Links e Transparent
// Checkout (PIX/Boleto avulso) — nenhum dos dois é usado pelo fluxo de
// cobrança do Ser Dono (só `subscriptions`, cobrança recorrente por cartão),
// então dar CRUD nisso no painel seria superfície nova sem necessidade real.
//
// Saques (`payouts/create`) e PIX pra terceiro (`pix/create`) MOVEM DINHEIRO
// DE VERDADE da conta AbacatePay — pedido explícito do dono do produto de
// incluir mesmo assim. Redundância de segurança: exige `confirm: true` no
// corpo (além do double-confirm que a tela já faz via `ConfirmModal`) e loga
// a ação com o id do admin antes de chamar a AbacatePay.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY")!;
const ABACATEPAY_BASE = "https://api.abacatepay.com/v2";

type Metodo = "GET" | "POST";

// path -> método permitido. Só o que o painel de fato usa (ver comentário
// acima pro que ficou de fora e por quê).
const ALLOWLIST: Record<string, Metodo> = {
  "/products/list": "GET",
  "/products/get": "GET",
  "/products/create": "POST",
  "/products/delete": "POST",
  "/webhooks/list": "GET",
  "/webhooks/get": "GET",
  "/webhooks/create": "POST",
  "/webhooks/delete": "POST",
  "/customers/list": "GET",
  "/customers/get": "GET",
  "/customers/delete": "POST",
  "/coupons/list": "GET",
  "/coupons/get": "GET",
  "/coupons/create": "POST",
  "/coupons/delete": "POST",
  "/coupons/toggle": "POST",
  "/subscriptions/list": "GET",
  "/payouts/list": "GET",
  "/payouts/get": "GET",
  "/payouts/create": "POST",
  "/pix/list": "GET",
  "/pix/get": "GET",
  "/pix/create": "POST",
  "/store/get": "GET",
};

// Ações que movem dinheiro de verdade — exigem `confirm: true` explícito no
// corpo, redundante com o double-confirm da UI (`ConfirmModal`), e viram log
// estruturado antes da chamada (auditoria: quem, quando, o quê).
const MOVIMENTA_DINHEIRO = new Set(["/payouts/create", "/pix/create"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserRoleFromJwt(authHeader: string): string {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1];
    const parsed = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof parsed.user_role === "string" ? parsed.user_role : "user";
  } catch {
    return "user";
  }
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
    if (getUserRoleFromJwt(authHeader) !== "admin") {
      return json({ error: "Apenas administradores podem executar essa ação." }, 403);
    }

    const reqBody = await req.json().catch(() => null);
    const path = reqBody?.path as string | undefined;
    const method = reqBody?.method as Metodo | undefined;
    const query = (reqBody?.query as Record<string, string> | undefined) ?? {};
    const body = reqBody?.body as Record<string, unknown> | undefined;

    if (!path || !method || ALLOWLIST[path] !== method) {
      return json({ error: "Endpoint não permitido neste painel." }, 400);
    }

    if (MOVIMENTA_DINHEIRO.has(path)) {
      if (body?.confirm !== true) {
        return json({ error: "Ação financeira exige confirmação explícita." }, 400);
      }
      console.log("admin-abacatepay-proxy: AÇÃO FINANCEIRA", {
        admin_id: auth.user.id,
        admin_email: auth.user.email,
        path,
        body: { ...body, confirm: undefined },
        em: new Date().toISOString(),
      });
    }

    const url = new URL(`${ABACATEPAY_BASE}${path}`);
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }

    const resp = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify({ ...(body ?? {}), confirm: undefined }) : undefined,
    });
    const respBody = await resp.json().catch(() => null);

    return json(respBody, resp.status);
  } catch (error) {
    console.error("admin-abacatepay-proxy", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
