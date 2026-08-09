import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Plano de Ação Mensal (SDD nova, pedido do dono do produto em 08/08/2026).
 * Cabeçalho (`planos_acao`) + itens (`planos_acao_itens`) sempre andam
 * juntos — daí `PlanoAcaoComItens` em vez de expor as duas tabelas soltas
 * pra quem chama montar por conta própria.
 */

export type PlanoAcaoRow = Tables<"planos_acao">;
export type PlanoAcaoItemRow = Tables<"planos_acao_itens">;

export interface PlanoAcaoComItens {
  plano: PlanoAcaoRow;
  itens: PlanoAcaoItemRow[];
}

async function itensDosPlanos(planoIds: string[]): Promise<PlanoAcaoItemRow[]> {
  if (planoIds.length === 0) return [];
  const { data, error } = await supabase
    .from("planos_acao_itens")
    .select("*")
    .in("plano_id", planoIds)
    .order("semana")
    .order("ordem");
  if (error) throw error;
  return data;
}

export async function getPlanoDoMes(userId: string, mesReferenciaISO: string): Promise<PlanoAcaoComItens | null> {
  const { data: plano, error } = await supabase
    .from("planos_acao")
    .select("*")
    .eq("user_id", userId)
    .eq("mes_referencia", mesReferenciaISO)
    .maybeSingle();
  if (error) throw error;
  if (!plano) return null;
  return { plano, itens: await itensDosPlanos([plano.id]) };
}

export async function listPlanosAcaoHistorico(userId: string): Promise<PlanoAcaoComItens[]> {
  const { data: planos, error } = await supabase
    .from("planos_acao")
    .select("*")
    .eq("user_id", userId)
    .order("mes_referencia", { ascending: false });
  if (error) throw error;
  const itens = await itensDosPlanos(planos.map((p) => p.id));
  return planos.map((plano) => ({ plano, itens: itens.filter((i) => i.plano_id === plano.id) }));
}

export async function getPlanosAcaoPorIds(ids: string[]): Promise<PlanoAcaoComItens[]> {
  if (ids.length === 0) return [];
  const { data: planos, error } = await supabase.from("planos_acao").select("*").in("id", ids);
  if (error) throw error;
  const itens = await itensDosPlanos(planos.map((p) => p.id));
  return planos.map((plano) => ({ plano, itens: itens.filter((i) => i.plano_id === plano.id) }));
}

export async function toggleItemPlanoAcao(itemId: string, concluido: boolean): Promise<void> {
  const { error } = await supabase
    .from("planos_acao_itens")
    .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw error;
}

/** Chama a Edge Function que gera o plano do mês corrente — validação de elegibilidade/unicidade mensal acontece no servidor. */
export async function gerarPlanoAcao(): Promise<PlanoAcaoComItens> {
  const { data, error } = await supabase.functions.invoke("plano-acao-gerar");
  if (error) {
    // `error` do supabase-js pra Edge Function com status != 2xx é genérico
    // ("Edge Function returned a non-2xx status code") — a mensagem de
    // verdade (ex.: "você já gerou o plano deste mês") vem no corpo JSON da
    // resposta, acessível via `error.context` (a `Response` bruta).
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return data as PlanoAcaoComItens;
}
