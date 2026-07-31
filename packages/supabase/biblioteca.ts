import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * Biblioteca de conteúdos (SDD-50) — cursos, vídeos, apostilas e dicas
 * exibidos no painel do empreendedor. Separada de `knowledge_articles`, que
 * alimenta o RAG do assistente (ver comentário da migration).
 */

export type BibliotecaConteudo = Tables<"biblioteca_conteudos">;
export type BibliotecaAula = Tables<"biblioteca_aulas">;

export type ConteudoTipo = "curso" | "video" | "apostila" | "dica";
export type ConteudoNivel = "basico" | "intermediario" | "avancado";

export const CONTEUDO_TIPO_LABEL: Record<ConteudoTipo, string> = {
  curso: "Curso",
  video: "Vídeo",
  apostila: "Apostila",
  dica: "Dica",
};

export const CONTEUDO_NIVEL_LABEL: Record<ConteudoNivel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export interface ConteudoComAulas extends BibliotecaConteudo {
  aulas: BibliotecaAula[];
}

// ---- Cliente (só conteúdo publicado — RLS já filtra `ativo`) ----

/** `limite` serve ao card do painel, que mostra só os primeiros itens. */
export async function listConteudos(limite?: number): Promise<BibliotecaConteudo[]> {
  let query = supabase.from("biblioteca_conteudos").select("*").order("ordem").order("created_at", { ascending: false });
  if (limite) query = query.limit(limite);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Detalhe de um conteúdo; `aulas` vem vazio para tudo que não é curso. */
export async function getConteudo(id: string): Promise<ConteudoComAulas | null> {
  const { data, error } = await supabase
    .from("biblioteca_conteudos")
    .select("*, aulas:biblioteca_aulas(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const conteudo = data as unknown as ConteudoComAulas;
  return { ...conteudo, aulas: [...conteudo.aulas].sort((a, b) => a.ordem - b.ordem) };
}

// ---- Admin ----

/** Inclui rascunhos (`ativo = false`) — só o admin enxerga, por RLS. */
export async function listConteudosAdmin(): Promise<BibliotecaConteudo[]> {
  const { data, error } = await supabase
    .from("biblioteca_conteudos")
    .select("*")
    .order("ordem")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface ConteudoInput {
  tipo: ConteudoTipo;
  titulo: string;
  descricao?: string | null;
  video_url?: string | null;
  arquivo_url?: string | null;
  conteudo_md?: string | null;
  thumbnail_url?: string | null;
  duracao_min?: number | null;
  nivel?: ConteudoNivel | null;
  ordem?: number;
  ativo?: boolean;
}

export async function createConteudo(input: ConteudoInput): Promise<BibliotecaConteudo> {
  const { data, error } = await supabase.from("biblioteca_conteudos").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateConteudo(id: string, input: Partial<ConteudoInput>): Promise<void> {
  const { error } = await supabase
    .from("biblioteca_conteudos")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteConteudo(id: string): Promise<void> {
  const { error } = await supabase.from("biblioteca_conteudos").delete().eq("id", id);
  if (error) throw error;
}

// ---- Aulas (só para `tipo = 'curso'`) ----

export async function addAula(
  conteudoId: string,
  input: { titulo: string; video_url?: string | null; duracao_min?: number | null; ordem?: number }
): Promise<void> {
  const { error } = await supabase.from("biblioteca_aulas").insert({ conteudo_id: conteudoId, ...input });
  if (error) throw error;
}

export async function deleteAula(id: string): Promise<void> {
  const { error } = await supabase.from("biblioteca_aulas").delete().eq("id", id);
  if (error) throw error;
}
