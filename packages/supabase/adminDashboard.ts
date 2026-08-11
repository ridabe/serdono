import { supabase } from "./client";

/**
 * Dashboard Admin — "Torre de Controle" (tema claro). Cada função aqui é uma
 * RPC agregada nova (ver migration `20260811120200_admin_dashboard_rpcs.sql`)
 * — mesmo espírito de `admin_dashboard_stats` (admin_panel_foundation): nunca
 * abrir SELECT amplo pro client em tabela de dado pessoal, o admin só recebe
 * contagem/agregação.
 */

export interface DashboardStats {
  total_usuarios: number;
  novos_usuarios_7d: number;
  usuarios_bloqueados: number;
  diagnosticos_concluidos: number;
  nichos_destravados: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as DashboardStats;
}

export interface CrescimentoDia {
  dia: string;
  novos_usuarios: number;
}

export async function getUserGrowth(dias = 30): Promise<CrescimentoDia[]> {
  const { data, error } = await supabase.rpc("admin_user_growth", { dias });
  if (error) throw error;
  return data as unknown as CrescimentoDia[];
}

export interface AdocaoModulo {
  modulo: string;
  habilitados: number;
}

export async function getModuleAdoption(): Promise<AdocaoModulo[]> {
  const { data, error } = await supabase.rpc("admin_module_adoption");
  if (error) throw error;
  return data as unknown as AdocaoModulo[];
}

export interface FornecedorPorCategoria {
  categoria: string;
  total: number;
}

export async function getFornecedoresByCategoria(): Promise<FornecedorPorCategoria[]> {
  const { data, error } = await supabase.rpc("admin_fornecedores_by_categoria");
  if (error) throw error;
  return data as unknown as FornecedorPorCategoria[];
}

export interface FunilFase {
  fase: string;
  alcancaram: number;
  total_jornadas: number;
}

export async function getJornadaFunnel(): Promise<FunilFase[]> {
  const { data, error } = await supabase.rpc("admin_jornada_funnel");
  if (error) throw error;
  return data as unknown as FunilFase[];
}

export interface DicaRanking {
  material_id: string;
  titulo: string;
  categoria: string;
  acessos: number;
}

export async function getDicasRanking(limite = 5): Promise<DicaRanking[]> {
  const { data, error } = await supabase.rpc("admin_dicas_ranking", { limite });
  if (error) throw error;
  return data as unknown as DicaRanking[];
}

export interface IaUsageTotals {
  total_chamadas: number;
  total_tokens: number;
  chamadas_7d: number;
  tokens_7d: number;
}

export async function getIaUsageTotals(): Promise<IaUsageTotals> {
  const { data, error } = await supabase.rpc("admin_ia_usage_totals");
  if (error) throw error;
  return data as unknown as IaUsageTotals;
}

export interface IaUsageDia {
  dia: string;
  chamadas: number;
  tokens: number;
}

export async function getIaUsagePorDia(dias = 14): Promise<IaUsageDia[]> {
  const { data, error } = await supabase.rpc("admin_ia_usage_por_dia", { dias });
  if (error) throw error;
  return data as unknown as IaUsageDia[];
}

export interface IaUsagePorFuncao {
  funcao: string;
  chamadas: number;
  tokens: number;
}

export async function getIaUsagePorFuncao(): Promise<IaUsagePorFuncao[]> {
  const { data, error } = await supabase.rpc("admin_ia_usage_por_funcao");
  if (error) throw error;
  return data as unknown as IaUsagePorFuncao[];
}

/**
 * Ordem fixa das fases da Jornada (mesma lista da migration mais recente a
 * alterar a constraint, `20260731160000_jornada_conclusao.sql`) — a coluna
 * `fase` não guarda ordem entre fases, só `admin_jornada_funnel` devolve as
 * linhas (uma por fase que já teve etapa concluída), sem ordem garantida.
 * Duplicada aqui de propósito, mesmo padrão já usado em `FASE_LABEL` da Edge
 * Function `knowledge-search` (Deno não importa o monorepo TS).
 */
export const FASE_ORDER = [
  "validacao_ideia",
  "planejamento",
  "formalizacao",
  "financeiro",
  "estrutura",
  "fornecedores",
  "produto",
  "marketing",
  "clientes",
  "primeira_venda",
  "organizacao",
] as const;

export const FASE_LABEL: Record<string, string> = {
  validacao_ideia: "Validação da Ideia",
  planejamento: "Planejamento",
  formalizacao: "Formalização",
  financeiro: "Financeiro",
  estrutura: "Estrutura",
  fornecedores: "Fornecedores",
  produto: "Produto",
  marketing: "Marketing",
  clientes: "Clientes",
  primeira_venda: "Primeira Venda",
  organizacao: "Organização",
};
