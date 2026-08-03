import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Módulo Meu Negócio em Dia (PRD §12.8, SPEC.md SDD-61).
 *
 * Dono do dado é o usuário (`user_id`), não a jornada (RN-29) — o catálogo
 * de obrigações (`obrigacoes_catalogo`) é curado e seedado por migration
 * (nunca editado pelo admin em runtime, ver comentário da migration).
 *
 * Este arquivo devolve linhas cruas do banco, sem depender de
 * `@serdono/core` (mesmo padrão de `retencao.ts`: a camada de dados nunca
 * conhece o tipo de domínio — quem converte pro formato de `packages/core`
 * é o hook que consome os dois lados, `useObrigacoes.ts`).
 */

export type ObrigacoesConfigRow = Tables<"obrigacoes_config">;
export type ObrigacaoCatalogoRow = Tables<"obrigacoes_catalogo">;

export interface ObrigacoesConfig {
  regime: string;
  temFuncionarios: boolean;
}

// ---- Configuração (regime + funcionários) ----

export async function getObrigacoesConfig(userId: string): Promise<ObrigacoesConfig | null> {
  const { data, error } = await supabase
    .from("obrigacoes_config")
    .select("regime, tem_funcionarios")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { regime: data.regime, temFuncionarios: data.tem_funcionarios };
}

export async function saveObrigacoesConfig(userId: string, config: ObrigacoesConfig): Promise<void> {
  const { error } = await supabase
    .from("obrigacoes_config")
    .upsert(
      { user_id: userId, regime: config.regime, tem_funcionarios: config.temFuncionarios },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}

// ---- Catálogo curado ----

export async function listObrigacoesCatalogo(): Promise<ObrigacaoCatalogoRow[]> {
  const { data, error } = await supabase.from("obrigacoes_catalogo").select("*").eq("ativo", true).order("ordem");
  if (error) throw error;
  return data;
}

// ---- Marcação de conclusão por período ----

export interface ObrigacaoStatusRow {
  obrigacaoId: string;
  periodoReferencia: string;
  concluidoEm: string;
}

export async function listStatusDoUsuario(userId: string): Promise<ObrigacaoStatusRow[]> {
  const { data, error } = await supabase
    .from("obrigacoes_status")
    .select("obrigacao_id, periodo_referencia, concluido_em")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((r) => ({ obrigacaoId: r.obrigacao_id, periodoReferencia: r.periodo_referencia, concluidoEm: r.concluido_em }));
}

export async function marcarConcluido(userId: string, obrigacaoId: string, periodoReferencia: string): Promise<void> {
  const { error } = await supabase
    .from("obrigacoes_status")
    .upsert(
      { user_id: userId, obrigacao_id: obrigacaoId, periodo_referencia: periodoReferencia },
      { onConflict: "user_id,obrigacao_id,periodo_referencia" }
    );
  if (error) throw error;
}

export async function desmarcarConcluido(userId: string, obrigacaoId: string, periodoReferencia: string): Promise<void> {
  const { error } = await supabase
    .from("obrigacoes_status")
    .delete()
    .eq("user_id", userId)
    .eq("obrigacao_id", obrigacaoId)
    .eq("periodo_referencia", periodoReferencia);
  if (error) throw error;
}
