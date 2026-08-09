import { supabase } from "./client";
import type { Tables } from "./types";

/** Raio-X Financeiro (pedido do dono do produto, 09/08/2026). */

export type DespesaDiariaRow = Tables<"raiox_despesas_diarias">;
export type FechamentoMensalRow = Tables<"raiox_financeiro_mensal">;

function primeiroDiaProximoMes(mesReferenciaISO: string): string {
  const [ano, mes] = mesReferenciaISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  data.setUTCMonth(data.getUTCMonth() + 1);
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

// ---- Despesas diárias (lançamento livre, editável, RLS completo) ----

export async function listDespesasDoMes(userId: string, mesReferenciaISO: string): Promise<DespesaDiariaRow[]> {
  const { data, error } = await supabase
    .from("raiox_despesas_diarias")
    .select("*")
    .eq("user_id", userId)
    .gte("data", mesReferenciaISO)
    .lt("data", primeiroDiaProximoMes(mesReferenciaISO))
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addDespesaDiaria(params: {
  userId: string;
  data: string;
  tipo: string;
  descricao?: string;
  valor: number;
}): Promise<DespesaDiariaRow> {
  const { data, error } = await supabase
    .from("raiox_despesas_diarias")
    .insert({ user_id: params.userId, data: params.data, tipo: params.tipo, descricao: params.descricao ?? null, valor: params.valor })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removerDespesaDiaria(id: string): Promise<void> {
  const { error } = await supabase.from("raiox_despesas_diarias").delete().eq("id", id);
  if (error) throw error;
}

// ---- Fechamento mensal (uma vez por mês, imutável depois de gravado) ----

export async function getFechamentoDoMes(userId: string, mesReferenciaISO: string): Promise<FechamentoMensalRow | null> {
  const { data, error } = await supabase
    .from("raiox_financeiro_mensal")
    .select("*")
    .eq("user_id", userId)
    .eq("mes_referencia", mesReferenciaISO)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Últimos fechamentos do usuário, mais recente primeiro — usado pra montar o comparativo mês a mês. */
export async function listUltimosFechamentos(userId: string, limite = 6): Promise<FechamentoMensalRow[]> {
  const { data, error } = await supabase
    .from("raiox_financeiro_mensal")
    .select("*")
    .eq("user_id", userId)
    .order("mes_referencia", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

export async function criarFechamentoMensal(params: {
  userId: string;
  mesReferencia: string;
  faturamento: number;
  despesas: number;
  retiradaSocio: number;
}): Promise<FechamentoMensalRow> {
  const { data, error } = await supabase
    .from("raiox_financeiro_mensal")
    .insert({
      user_id: params.userId,
      mes_referencia: params.mesReferencia,
      faturamento: params.faturamento,
      despesas: params.despesas,
      retirada_socio: params.retiradaSocio,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
