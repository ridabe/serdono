import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Assistente de Reunião (pedido do dono do produto, 12/08/2026, V1). Sem
 * trava mensal — o usuário pode gerar quantos guias precisar, cada um vira
 * uma linha nova em `reunioes` (histórico simples, sem edição).
 */

export type ReuniaoRow = Tables<"reunioes">;

/** Mais recentes primeiro — vira a lista/histórico da tela do módulo. */
export async function listarReunioes(userId: string): Promise<ReuniaoRow[]> {
  const { data, error } = await supabase.from("reunioes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function buscarReuniao(id: string): Promise<ReuniaoRow | null> {
  const { data, error } = await supabase.from("reunioes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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
