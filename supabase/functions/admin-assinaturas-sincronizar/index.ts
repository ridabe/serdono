// Ser Dono — Edge Function "admin-assinaturas-sincronizar" (Painel Admin de
// Assinaturas, pedido do dono do produto, 17/08/2026).
//
// Detecta inadimplência. Achado ao levantar a API antes de codificar: os
// únicos 3 eventos de webhook de assinatura que a AbacatePay documenta
// (`subscription.completed`/`renewed`/`cancelled`) NÃO incluem cobrança
// recorrente que falhou — não existe `subscription.overdue`/`payment_failed`
// na doc pública. Sem isso, nosso banco nunca saberia sozinho que uma
// assinatura "ativa" parou de pagar. Solução: sincronização SOB DEMANDA
// (botão no painel, não um cron) contra `GET /v2/subscriptions/list?id=...`
// — o único status da AbacatePay que sinaliza isso é `EXPIRED` ("Expired
// without payment"), mapeado aqui pra `inadimplente`.
//
// **Risco conhecido, não verificado ponta a ponta (nenhuma assinatura real
// expirou ainda pra confirmar o formato de resposta)**: a doc resumida (via
// WebFetch, não fonte primária lida linha a linha) não deixa claro se
// `GET /subscriptions/list?id=X` devolve um array em `data` ou um objeto
// único — o parse abaixo aceita os dois formatos e ignora silenciosamente
// (loga e pula) qualquer assinatura cuja resposta não bater com nenhum dos
// dois, em vez de quebrar a sincronização inteira por causa de 1 registro.
//
// Só MARCA o status (`subscriptions.status = 'inadimplente'`) — nunca rebaixa
// `users.plano_atual` sozinho. Decisão deliberada: um admin humano decide se
// e quando cortar o acesso, a sincronização só traz o sinal.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY")!;

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

type StatusAbacatePay = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED";

async function buscarStatusAbacatePay(billingId: string): Promise<StatusAbacatePay | null> {
  const resp = await fetch(`https://api.abacatepay.com/v2/subscriptions/list?id=${encodeURIComponent(billingId)}`, {
    headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}` },
  });
  if (!resp.ok) {
    console.warn("admin-assinaturas-sincronizar: falha ao consultar", billingId, resp.status);
    return null;
  }
  const body = await resp.json().catch(() => null);
  const lista = Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
  const item = lista.find((i: { id?: string }) => i.id === billingId) ?? lista[0];
  return (item?.status as StatusAbacatePay) ?? null;
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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: pendentes, error: fetchError } = await admin
      .from("subscriptions")
      .select("id, user_id, plano, abacatepay_billing_id")
      .eq("origem", "abacatepay")
      .in("status", ["ativa", "pendente"])
      .not("abacatepay_billing_id", "is", null);
    if (fetchError) throw fetchError;

    let verificadas = 0;
    let marcadasInadimplentes = 0;
    let sincronizadasCanceladas = 0;
    let ignoradas = 0;
    const agora = new Date().toISOString();

    for (const sub of pendentes ?? []) {
      verificadas++;
      const statusRemoto = await buscarStatusAbacatePay(sub.abacatepay_billing_id as string);
      if (!statusRemoto) {
        ignoradas++;
        continue;
      }

      if (statusRemoto === "EXPIRED") {
        await admin.from("subscriptions").update({ status: "inadimplente", updated_at: agora }).eq("id", sub.id);
        marcadasInadimplentes++;
      } else if (statusRemoto === "CANCELLED" || statusRemoto === "REFUNDED") {
        await admin.from("subscriptions").update({ status: "cancelada", cancelado_em: agora, updated_at: agora }).eq("id", sub.id);
        const { data: outraAtiva } = await admin
          .from("subscriptions")
          .select("plano")
          .eq("user_id", sub.user_id)
          .eq("status", "ativa")
          .neq("id", sub.id)
          .maybeSingle();
        await admin.from("users").update({ plano_atual: outraAtiva?.plano ?? "gratuito" }).eq("id", sub.user_id);
        sincronizadasCanceladas++;
      }
      // PENDING/PAID batem com o que já temos (pendente/ativa) — nada a fazer.
    }

    return json({ verificadas, marcadasInadimplentes, sincronizadasCanceladas, ignoradas });
  } catch (error) {
    console.error("admin-assinaturas-sincronizar", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
