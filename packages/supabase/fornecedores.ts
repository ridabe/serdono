import { supabase } from "./client";
import type { Tables } from "./types";

export type FornecedorParceiro = Tables<"fornecedores_parceiros">;
export type JornadaFornecedor = Tables<"jornada_fornecedores">;

/**
 * Fase 8 — Fornecedores (SDD-41). Duas fontes de dado:
 *  - `fornecedores_parceiros`: base curada pelo admin (Painel Admin), lida
 *    aqui só por filtro simples de nicho — a busca semântica (RAG,
 *    `match_fornecedores_parceiros`) fica pra quando a base tiver conteúdo
 *    de verdade, não faz sentido rodar embedding sobre uma tabela vazia.
 *  - `jornada_fornecedores`: a lista que o próprio empreendedor monta.
 */

// ---- Base de parceiros (admin) ----

export async function listParceiros(): Promise<FornecedorParceiro[]> {
  const { data, error } = await supabase.from("fornecedores_parceiros").select("*").order("nome");
  if (error) throw error;
  return data;
}

export interface ParceiroInput {
  nome: string;
  categoria: string;
  descricao?: string;
  regiao?: string;
  contato?: string;
  site?: string;
  niches_aplicaveis?: string[];
}

export async function createParceiro(params: ParceiroInput): Promise<void> {
  const { error } = await supabase.from("fornecedores_parceiros").insert(params);
  if (error) throw error;
}

export async function updateParceiro(id: string, params: Partial<ParceiroInput>): Promise<void> {
  const { error } = await supabase.from("fornecedores_parceiros").update(params).eq("id", id);
  if (error) throw error;
}

export async function setParceiroAtivo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("fornecedores_parceiros").update({ ativo }).eq("id", id);
  if (error) throw error;
}

/**
 * Sugestões pro nicho do usuário — filtro direto (sem embedding). Um
 * parceiro com `niches_aplicaveis` vazio se aplica a qualquer nicho. Filtro
 * feito no client (não via `.or()` do PostgREST) de propósito: sintaxe de
 * filtro `cs`/`eq` em coluna array é frágil de montar como string, e essa
 * tabela é curada pelo admin — pequena por natureza, não justifica a
 * complexidade de um filtro server-side aqui.
 */
export async function getParceirosSugeridos(nicheId: string | null): Promise<FornecedorParceiro[]> {
  const { data, error } = await supabase.from("fornecedores_parceiros").select("*").eq("ativo", true).order("nome");
  if (error) throw error;
  if (!nicheId) return data;
  return data.filter((p) => p.niches_aplicaveis.length === 0 || p.niches_aplicaveis.includes(nicheId));
}

// ---- Lista pessoal do empreendedor ----

export interface JornadaFornecedorInput {
  categoria: string;
  nome_fornecedor: string;
  avaliacao?: string;
  preco?: string;
  prazo?: string;
  contato?: string;
  parceiro_id?: string;
  origem?: "pesquisa_propria" | "parceiro";
}

export async function listJornadaFornecedores(instanceId: string): Promise<JornadaFornecedor[]> {
  const { data, error } = await supabase
    .from("jornada_fornecedores")
    .select("*")
    .eq("jornada_instance_id", instanceId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addJornadaFornecedor(instanceId: string, input: JornadaFornecedorInput): Promise<void> {
  const { error } = await supabase.from("jornada_fornecedores").insert({ jornada_instance_id: instanceId, ...input });
  if (error) throw error;
}

export async function updateJornadaFornecedor(id: string, input: Partial<JornadaFornecedorInput>): Promise<void> {
  const { error } = await supabase.from("jornada_fornecedores").update(input).eq("id", id);
  if (error) throw error;
}

export async function removeJornadaFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from("jornada_fornecedores").delete().eq("id", id);
  if (error) throw error;
}

// ---- Roteiro de busca gerado por IA ----

export interface RoteiroFornecedoresCategoria {
  nome: string;
  explicacao: string;
  o_que_avaliar: string;
  busca_google_url: string;
}

/**
 * IA gera só CATEGORIAS de fornecedor relevantes pro nicho e como avaliar
 * cada uma — nunca nome de empresa específica (evita alucinação, RN-1/RN-20:
 * dado real vem da base de parceiros ou da pesquisa do próprio usuário,
 * nunca inventado pela IA).
 */
export async function generateRoteiroFornecedores(instanceId: string): Promise<RoteiroFornecedoresCategoria[]> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-fornecedores", {
    body: { jornada_instance_id: instanceId },
  });
  if (error) throw error;
  return (data as { categorias: RoteiroFornecedoresCategoria[] }).categorias;
}

export async function getRoteiroFornecedores(instanceId: string): Promise<RoteiroFornecedoresCategoria[] | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "fornecedores_roteiro")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as { categorias: RoteiroFornecedoresCategoria[] } | undefined)?.categorias ?? null;
}
