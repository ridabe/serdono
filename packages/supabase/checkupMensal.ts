import { supabase } from "./client";
import type { Tables } from "./types";

/** Check-up Mensal do Negócio (pedido do dono do produto, 08/08/2026, prioridade nº 1). */

export type CheckupMensalRow = Tables<"checkups_mensais">;

export async function getCheckupDoMes(userId: string, mesReferenciaISO: string): Promise<CheckupMensalRow | null> {
  const { data, error } = await supabase
    .from("checkups_mensais")
    .select("*")
    .eq("user_id", userId)
    .eq("mes_referencia", mesReferenciaISO)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Chama a Edge Function que analisa as respostas e grava o check-up do mês corrente — elegibilidade/unicidade mensal validadas no servidor. */
export async function gerarCheckupMensal(respostas: Record<string, unknown>): Promise<CheckupMensalRow> {
  const { data, error } = await supabase.functions.invoke("checkup-gerar", { body: { respostas } });
  if (error) {
    // Mesma lacuna do supabase-js já documentada em `gerarPlanoAcao`
    // (SDD-86): erro de status != 2xx vem genérico, a mensagem de verdade
    // está no corpo JSON da resposta.
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return (data as { checkup: CheckupMensalRow }).checkup;
}
