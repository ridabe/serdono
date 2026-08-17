// Ser Dono — Edge Function "admin-plano-definir" (Painel Admin de
// Assinaturas, pedido do dono do produto, 17/08/2026).
//
// Concede/altera o plano de um usuário de dentro do Painel Admin, sem passar
// pelo checkout da AbacatePay — cobre os dois pedidos que viraram a mesma
// coisa aqui: "adicionar automaticamente a um plano sem cobrança, como
// brinde" e "alteração manual de plano". Qualquer plano definido por aqui
// nasce `origem = 'concedido_admin'`: nunca fabrica um `abacatepay_billing_id`
// de verdade, então nunca entra na receita REAL (`admin_assinaturas_resumo`),
// só na potencial — é sempre não-verificado do ponto de vista do gateway,
// mesmo que o motivo real seja "o cliente pagou por fora".
//
// Mesmo padrão de auth de `admin-manage-user`: decodifica o claim `user_role`
// do JWT bruto (sem round-trip), só então usa service_role pra escrever.
// `subscriptions` não tem policy de insert/update pro client (SDD-110) — só
// Edge Function com service_role grava lá.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Preço de lançamento (packages/core/planos.ts::PLANOS_CATALOGO) — duplicado
// pelo mesmo motivo de sempre: Edge Function não importa @serdono/core. É o
// valor gravado em `preco_centavos` da linha de cortesia, pro cálculo de
// "receita potencial" refletir o preço de tabela de verdade, não zero.
const PRECO_CENTAVOS_POR_PLANO: Record<string, number> = { essencial: 1990, master: 3990 };

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

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const plano = body?.plano as string | undefined;
    const nota = (body?.nota as string | undefined)?.trim() || null;
    if (!userId || (plano !== "gratuito" && plano !== "essencial" && plano !== "master")) {
      return json({ error: "Campos 'userId' e 'plano' (gratuito/essencial/master) são obrigatórios." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const agora = new Date().toISOString();

    // Sempre encerra qualquer assinatura ativa anterior (real ou cortesia) —
    // nunca mais de uma linha `ativa` por usuário, mesmo espírito do
    // `assinatura-webhook` ao processar `subscription.cancelled`.
    const { error: cancelError } = await admin
      .from("subscriptions")
      .update({ status: "cancelada", cancelado_em: agora, updated_at: agora })
      .eq("user_id", userId)
      .eq("status", "ativa");
    if (cancelError) throw cancelError;

    if (plano !== "gratuito") {
      const { error: insertError } = await admin.from("subscriptions").insert({
        user_id: userId,
        plano,
        status: "ativa",
        origem: "concedido_admin",
        preco_centavos: PRECO_CENTAVOS_POR_PLANO[plano],
        // Sintético de propósito — a coluna é NOT NULL UNIQUE pra garantir
        // que todo evento do webhook real ache a linha certa; cortesia do
        // admin nunca tem contrapartida na AbacatePay, então nunca reaproveita
        // esse formato de id (`user:plano:timestamp`, ver assinatura-criar-checkout).
        abacatepay_external_id: `admin:${crypto.randomUUID()}`,
        iniciado_em: agora,
        renovado_em: agora,
        concedido_por: auth.user.id,
        nota,
      });
      if (insertError) throw insertError;
    }

    const { error: userError } = await admin.from("users").update({ plano_atual: plano }).eq("id", userId);
    if (userError) throw userError;

    return json({ ok: true });
  } catch (error) {
    console.error("admin-plano-definir", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
