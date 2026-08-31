import { supabase } from "./client";
import type { Tables } from "./types";

export type NichoRow = Tables<"niches">;

/**
 * Nichos gerados pela IA no diagnóstico (SDD-137) — quando a pessoa descreveu
 * um ramo que não existia no catálogo curado. Os números são estimativa; o
 * admin revisa aqui e ou promove a 'curado' (depois de conferir com pesquisa
 * real) ou apaga.
 */
export async function listNichosGeradosPelaIa(): Promise<NichoRow[]> {
  const { data, error } = await supabase
    .from("niches")
    .select("*")
    .eq("origem", "ia")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Quantos nichos curados existem — contexto pro admin ("X gerados / Y no catálogo"). */
export async function contarNichosCurados(): Promise<number> {
  const { count, error } = await supabase
    .from("niches")
    .select("id", { count: "exact", head: true })
    .eq("origem", "curado");
  if (error) throw error;
  return count ?? 0;
}

/** Marca o nicho como curado — o admin já conferiu os números. */
export async function promoverNichoParaCurado(id: string): Promise<void> {
  const { error } = await supabase.from("niches").update({ origem: "curado" }).eq("id", id);
  if (error) throw error;
}

/**
 * Apaga um nicho gerado pela IA. `niche_matches` e `niche_sub_negocios` caem
 * junto (ON DELETE CASCADE). `jornada_instances.niche_id` é NO ACTION — se
 * alguém já começou uma Jornada com esse ramo, o banco recusa a exclusão
 * (código 23503); a tela mostra isso e sugere promover a curado.
 */
export async function apagarNicho(id: string): Promise<void> {
  const { error } = await supabase.from("niches").delete().eq("id", id);
  if (error) throw error;
}
