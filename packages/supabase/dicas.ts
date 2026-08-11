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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Uma categoria com seus materiais, pra tela de drill-down
 * (`/dicas-da-mary/[id]`) — evita buscar todo o catálogo só pra abrir uma
 * categoria. `null` quando o id não existe, não é um UUID válido (ex.: URL
 * digitada errada) ou (por RLS) não está publicado.
 *
 * A checagem de formato é feita aqui, antes da query: `.eq("id", ...)` com
 * um valor que não é UUID faz o Postgres devolver um erro de sintaxe cru
 * ("invalid input syntax for type uuid") em vez de simplesmente não achar a
 * linha — sem essa guarda, esse erro de banco vazava direto pra tela do
 * usuário (achado testando `/dicas-da-mary/id-que-nao-existe`).
 */
export async function getCategoriaComMateriais(categoriaId: string): Promise<CategoriaComMateriais | null> {
  if (!UUID_RE.test(categoriaId)) return null;

  const { data, error } = await supabase
    .from("dicas_categorias")
    .select("*, materiais:dicas_materiais(*)")
    .eq("id", categoriaId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const categoria = data as unknown as CategoriaComMateriais;
  return { ...categoria, materiais: [...categoria.materiais].sort((a, b) => a.ordem - b.ordem) };
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

// ---- Tracking de acesso (alimenta o ranking "mais acessadas" do Dashboard Admin) ----

export type DicaAcessoTipo = "video" | "pdf" | "link";

/**
 * Best-effort de propósito (igual ao registro de uso de IA nas Edge
 * Functions): abrir um material nunca pode falhar por causa do tracking —
 * loga e segue.
 */
export async function logDicaAcesso(materialId: string, userId: string, tipo: DicaAcessoTipo): Promise<void> {
  const { error } = await supabase.from("dicas_acessos").insert({ material_id: materialId, user_id: userId, tipo });
  if (error) console.error("Falha ao registrar acesso a dica (seguindo sem bloquear):", error);
}
