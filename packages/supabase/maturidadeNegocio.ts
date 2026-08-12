import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Nível de Maturidade do Negócio + Ser Dono Score (pedido do dono do
 * produto, 12/08/2026). Sem questionário próprio — o snapshot é calculado
 * pela Edge Function `maturidade-calcular` a partir de dado que já existe em
 * outros módulos, por isso não há aqui nenhuma função de "enviar respostas"
 * como em `checkupMensal.ts`.
 */

export type MaturidadeSnapshotRow = Tables<"maturidade_snapshots">;

export async function getSnapshotMaturidadeDoMes(userId: string, mesReferenciaISO: string): Promise<MaturidadeSnapshotRow | null> {
  const { data, error } = await supabase
    .from("maturidade_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("mes_referencia", mesReferenciaISO)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Snapshot mais recente do usuário, independente do mês — usado pelo card-resumo da Início, que não força geração. */
export async function getUltimoSnapshotMaturidade(userId: string): Promise<MaturidadeSnapshotRow | null> {
  const { data, error } = await supabase
    .from("maturidade_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("mes_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Chama a Edge Function que calcula o snapshot do mês corrente — elegibilidade/unicidade mensal validadas no servidor. */
export async function gerarSnapshotMaturidade(): Promise<MaturidadeSnapshotRow> {
  const { data, error } = await supabase.functions.invoke("maturidade-calcular");
  if (error) {
    // Mesma lacuna do supabase-js já documentada em `gerarPlanoAcao`/
    // `gerarCheckupMensal`: erro de status != 2xx vem genérico, a mensagem
    // de verdade está no corpo JSON da resposta.
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return (data as { snapshot: MaturidadeSnapshotRow }).snapshot;
}
