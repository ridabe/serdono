import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Assistente de Contrato (pedido do dono do produto, 17/08/2026). Diferente
 * de todo módulo de IA do produto: `criarContrato` é um insert direto
 * client→Postgres via RLS, sem Edge Function — não há geração por IA aqui,
 * `gerarClausulas` (packages/core/contrato.ts) roda 100% local. Sem trava
 * mensal, cada contrato gerado é uma linha nova (histórico simples, sem
 * edição de conteúdo — RN-62).
 */

export type ContratoRow = Tables<"contratos">;

/** Mais recentes primeiro — vira a lista/histórico da tela do módulo. */
export async function listarContratos(userId: string): Promise<ContratoRow[]> {
  const { data, error } = await supabase.from("contratos").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function buscarContrato(id: string): Promise<ContratoRow | null> {
  const { data, error } = await supabase.from("contratos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface CriarContratoParams {
  userId: string;
  tipo: string;
  titulo: string;
  campos: unknown;
}

/** Insert direto (sem Edge Function) — o conteúdo do contrato é recalculado sempre a partir de `campos`, nunca persistido. */
export async function criarContrato(params: CriarContratoParams): Promise<ContratoRow> {
  const { data, error } = await supabase
    .from("contratos")
    .insert({
      user_id: params.userId,
      tipo: params.tipo,
      titulo: params.titulo,
      campos: params.campos as never,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Chama a Edge Function que monta o e-mail (corpo em HTML, não anexo — ver SDD-109) e envia via Resend; grava enviado_em/enviado_para no retorno. Sempre ação explícita do usuário (RN-63). */
export async function enviarContratoPorEmail(contratoId: string, destinatarioEmail: string): Promise<ContratoRow> {
  const { data, error } = await supabase.functions.invoke("contrato-enviar-email", {
    body: { contrato_id: contratoId, destinatario_email: destinatarioEmail },
  });
  if (error) {
    // Mesma lacuna do supabase-js já documentada em `gerarReuniao`: erro de
    // status != 2xx vem genérico, a mensagem de verdade está no corpo JSON.
    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return (data as { contrato: ContratoRow }).contrato;
}
