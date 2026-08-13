import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Assistente de Reunião (pedido do dono do produto, 12/08/2026, V1). Sem
 * trava mensal — o usuário pode gerar quantos guias precisar, cada um vira
 * uma linha nova em `reunioes` (histórico simples, sem edição).
 *
 * V2 fatia 1 (12/08/2026): agendamento em `reunioes_agenda`, tabela
 * separada e mutável (reagendar/cancelar) — diferente de `reunioes`, cujo
 * `guia` continua imutável (RN-51).
 */

export type ReuniaoRow = Tables<"reunioes">;
export type AgendamentoRow = Tables<"reunioes_agenda">;

export interface ReuniaoComAgenda extends ReuniaoRow {
  agendamento: AgendamentoRow | null;
}

/**
 * `reunioes_agenda` vem como objeto único no embed (não array): o
 * `unique(reuniao_id)` da migration faz o PostgREST reconhecer a relação
 * como 1:1 do lado de `reunioes`, não 1:N — achado testando no preview web
 * (a suposição original de "vem como array" estava errada).
 */
function comAgenda(row: ReuniaoRow & { reunioes_agenda: AgendamentoRow | null }): ReuniaoComAgenda {
  const { reunioes_agenda, ...reuniao } = row;
  return { ...reuniao, agendamento: reunioes_agenda ?? null };
}

/** Mais recentes primeiro — vira a lista/histórico da tela do módulo, já com o agendamento (se houver) embutido. */
export async function listarReunioes(userId: string): Promise<ReuniaoComAgenda[]> {
  const { data, error } = await supabase
    .from("reunioes")
    .select("*, reunioes_agenda(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as (ReuniaoRow & { reunioes_agenda: AgendamentoRow | null })[]).map(comAgenda);
}

export async function buscarReuniao(id: string): Promise<ReuniaoComAgenda | null> {
  const { data, error } = await supabase.from("reunioes").select("*, reunioes_agenda(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? comAgenda(data as unknown as ReuniaoRow & { reunioes_agenda: AgendamentoRow | null }) : null;
}

export interface GerarReuniaoParams {
  tipo: string;
  tipoOutroDetalhe?: string;
  comQuem: string;
  objetivo: string;
  observacoes?: string;
}

/** Chama a Edge Function que gera o guia da reunião — validação de campos obrigatórios acontece no servidor. */
export async function gerarReuniao(params: GerarReuniaoParams): Promise<ReuniaoRow> {
  const { data, error } = await supabase.functions.invoke("reuniao-gerar", {
    body: {
      tipo: params.tipo,
      tipo_outro_detalhe: params.tipoOutroDetalhe,
      com_quem: params.comQuem,
      objetivo: params.objetivo,
      observacoes: params.observacoes,
    },
  });
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
  return (data as { reuniao: ReuniaoRow }).reuniao;
}

// ---- Agenda (V2, fatia 1) ----

export interface SalvarAgendamentoParams {
  dataHoraISO: string;
  localTipo: string;
  localValor: string;
  contatoNome?: string;
}

export async function getAgendamento(reuniaoId: string): Promise<AgendamentoRow | null> {
  const { data, error } = await supabase.from("reunioes_agenda").select("*").eq("reuniao_id", reuniaoId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Upsert por `reuniao_id` (unique na tabela) — cobre criar e reagendar com a mesma função. */
export async function salvarAgendamento(reuniaoId: string, params: SalvarAgendamentoParams): Promise<AgendamentoRow> {
  const { data, error } = await supabase
    .from("reunioes_agenda")
    .upsert(
      {
        reuniao_id: reuniaoId,
        data_hora: params.dataHoraISO,
        local_tipo: params.localTipo,
        local_valor: params.localValor,
        contato_nome: params.contatoNome ?? null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "reuniao_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelarAgendamento(reuniaoId: string): Promise<void> {
  const { error } = await supabase.from("reunioes_agenda").delete().eq("reuniao_id", reuniaoId);
  if (error) throw error;
}

// ---- Lembrete automático (V2, fatia 2) ----

export interface ProximoLembreteReuniao {
  reuniaoId: string;
  dataHoraISO: string;
  comQuem: string;
  tipo: string;
}

/**
 * Reunião agendada mais próxima dentro de uma janela (RN-55) — usada pelo
 * destaque da Início. `agoraISO`/`antesDeISO` vêm de fora (calculados por
 * `fimJanelaLembreteInicioISO` de `packages/core`) porque este pacote não
 * depende de `packages/core` (só o inverso, nunca o contrário).
 */
export async function getProximoLembreteReuniao(userId: string, agoraISO: string, antesDeISO: string): Promise<ProximoLembreteReuniao | null> {
  const { data, error } = await supabase
    .from("reunioes_agenda")
    .select("reuniao_id, data_hora, reunioes!inner(com_quem, tipo, user_id)")
    .eq("reunioes.user_id", userId)
    .gte("data_hora", agoraISO)
    .lt("data_hora", antesDeISO)
    .order("data_hora", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const reuniao = (data as unknown as { reunioes: { com_quem: string; tipo: string } }).reunioes;
  return {
    reuniaoId: data.reuniao_id as string,
    dataHoraISO: data.data_hora as string,
    comQuem: reuniao.com_quem,
    tipo: reuniao.tipo,
  };
}
