// Ser Dono — Edge Function "assinatura-cancelar" (cobrança via AbacatePay,
// pedido do dono do produto, 17/08/2026).
//
// Cancela a assinatura ATIVA do usuário logado na AbacatePay e reflete
// localmente — sem período de carência (a própria AbacatePay documenta:
// "o cliente perde o acesso imediatamente").
//
// RISCO CONHECIDO, não verificado nesta sessão (sem checkout real disparado
// ainda): a doc de `/v2/subscriptions/cancel` pede `{ id: "subs_..." }`, mas
// o `id` que guardamos em `abacatepay_billing_id` veio da resposta de
// `/v2/subscriptions/create`, documentada como um objeto "Billing" com
// `id: "bill_..."`. Pode ser o mesmo valor com prefixo diferente na doc, ou
// pode ser um id genuinamente diferente — só confirma testando de verdade.
// Se a AbacatePay devolver 404 aqui, é o primeiro lugar a olhar.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) throw subError;
    if (!subscription) return json({ error: "Você não tem uma assinatura ativa pra cancelar." }, 400);

    const resp = await fetch("https://api.abacatepay.com/v2/subscriptions/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: subscription.abacatepay_billing_id }),
    });
    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error("AbacatePay subscriptions/cancel falhou", resp.status, detalhe);
      return json({ error: "Não foi possível cancelar agora. Tente de novo em instantes." }, 502);
    }

    const agora = new Date().toISOString();
    await admin
      .from("subscriptions")
      .update({ status: "cancelada", cancelado_em: agora, updated_at: agora })
      .eq("id", subscription.id);
    await admin.from("users").update({ plano_atual: "gratuito" }).eq("id", user.id);

    return json({ ok: true });
  } catch (error) {
    console.error("assinatura-cancelar", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
