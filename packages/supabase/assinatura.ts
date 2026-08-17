import { supabase } from "./client";
import { getPlanoAtual } from "./modules";
import type { Tables } from "./types";

/**
 * Cobrança via AbacatePay (pedido do dono do produto, 17/08/2026). O
 * checkout em si nasce sempre na web (RN-17/RNF-8) — o app Android só abre
 * a URL devolvida por `criarCheckout` num navegador (in-app ou externo),
 * nunca processa pagamento dentro do app (evita comissão de loja).
 *
 * `subscriptions` é escrita só pelas Edge Functions (service_role) — o
 * client aqui só lê a própria linha (RLS `select_own`) e invoca as
 * functions que fazem a escrita de verdade.
 */

export type SubscriptionRow = Tables<"subscriptions">;

export { getPlanoAtual };

/** Histórico de assinaturas do usuário, mais recente primeiro. */
export async function listarAssinaturas(userId: string): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Chama a Edge Function que cria o checkout de assinatura na AbacatePay — devolve a URL pra redirecionar o usuário. */
export async function criarCheckout(plano: "essencial" | "master"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("assinatura-criar-checkout", { body: { plano } });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return (data as { checkoutUrl: string }).checkoutUrl;
}

/** Chama a Edge Function que cancela a assinatura ativa do usuário na AbacatePay. */
export async function cancelarAssinatura(): Promise<void> {
  const { error } = await supabase.functions.invoke("assinatura-cancelar", { body: {} });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
}
