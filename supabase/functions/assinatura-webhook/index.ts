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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    const billingId = (data.id ?? data.billingId) as string | undefined;
    const externalId = data.externalId as string | undefined;

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
      console.warn("assinatura-webhook: nenhuma subscription encontrada", { evento, billingId, externalId });
      return json({ ignorado: true });
    }

    const agora = new Date().toISOString();

    if (evento === "subscription.completed" || evento === "subscription.renewed") {
      await admin
        .from("subscriptions")
        .update({
          status: "ativa",
          iniciado_em: subscription.iniciado_em ?? agora,
          renovado_em: agora,
          updated_at: agora,
        })
        .eq("id", subscription.id);
      await admin.from("users").update({ plano_atual: subscription.plano }).eq("id", subscription.user_id);
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
