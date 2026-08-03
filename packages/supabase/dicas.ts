import { supabase } from "./client";
import type { Tables } from "./types";

/**
 * "Dicas da Mary" (PRD §12.7, SPEC.md SDD-59) — substitui a Biblioteca de
 * Conteúdos (SDD-50): mesma proposta de acesso livre a todo autenticado, sem
 * gate de módulo/plano (RN-34), mas com categorias (cada uma com texto
 * explicativo) e materiais onde PDF/vídeo/link são combináveis, não
 * mutuamente exclusivos por um `tipo` como antes.
 */

export type DicasCategoria = Tables<"dicas_categorias">;
export type DicasMaterial = Tables<"dicas_materiais">;
export type MaterialNivel = "basico" | "intermediario" | "avancado";

export const MATERIAL_NIVEL_LABEL: Record<MaterialNivel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export interface CategoriaComMateriais extends DicasCategoria {
  materiais: DicasMaterial[];
}

// ---- Cliente (RLS já filtra ativo=true nas duas tabelas) ----

export async function listCategoriasComMateriais(): Promise<CategoriaComMateriais[]> {
  const { data, error } = await supabase
    .from("dicas_categorias")
    .select("*, materiais:dicas_materiais(*)")
    .order("ordem");
  if (error) throw error;
  return (data as unknown as CategoriaComMateriais[]).map((c) => ({
    ...c,
    materiais: [...c.materiais].sort((a, b) => a.ordem - b.ordem),
  }));
}

// ---- Admin: categorias ----

export async function listCategoriasAdmin(): Promise<DicasCategoria[]> {
  const { data, error } = await supabase.from("dicas_categorias").select("*").order("ordem");
  if (error) throw error;
  return data;
}

export interface CategoriaInput {
  titulo: string;
  descricao: string;
  ordem?: number;
  ativo?: boolean;
}

export async function createCategoria(input: CategoriaInput): Promise<DicasCategoria> {
  const { data, error } = await supabase.from("dicas_categorias").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateCategoria(id: string, input: Partial<CategoriaInput>): Promise<void> {
  const { error } = await supabase.from("dicas_categorias").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from("dicas_categorias").delete().eq("id", id);
  if (error) throw error;
}

// ---- Admin: materiais ----

export async function listMateriaisAdmin(categoriaId: string): Promise<DicasMaterial[]> {
  const { data, error } = await supabase
    .from("dicas_materiais")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("ordem");
  if (error) throw error;
  return data;
}

export interface MaterialInput {
  categoria_id: string;
  titulo: string;
  descricao?: string | null;
  arquivo_url?: string | null;
  arquivo_nome?: string | null;
  video_url?: string | null;
  link_externo_url?: string | null;
  link_externo_label?: string | null;
  nivel?: MaterialNivel | null;
  ordem?: number;
  ativo?: boolean;
}

export async function createMaterial(input: MaterialInput): Promise<DicasMaterial> {
  const { data, error } = await supabase.from("dicas_materiais").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateMaterial(id: string, input: Partial<MaterialInput>): Promise<void> {
  const { error } = await supabase.from("dicas_materiais").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from("dicas_materiais").delete().eq("id", id);
  if (error) throw error;
}
