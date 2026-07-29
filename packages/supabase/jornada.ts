import { supabase } from "./client";
import type { Tables } from "./types";

export type JornadaInstance = Tables<"jornada_instances">;

/**
 * Jornada Empreendedora — módulo 1 (SDD-31). `jornada_instances` nasce só
 * quando o usuário confirma um nicho pós-login; a Fase 1/Descoberta já é
 * coberta pelo diagnóstico pré-login existente (`diagnostic_responses`/
 * `niche_matches`), sem tabela própria.
 */

export async function getMyJornada(userId: string): Promise<JornadaInstance | null> {
  const { data, error } = await supabase.from("jornada_instances").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function startJornada(userId: string, nicheId: string): Promise<JornadaInstance> {
  const { data, error } = await supabase
    .from("jornada_instances")
    .insert({ user_id: userId, niche_id: nicheId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Apaga a tentativa de diagnóstico anterior (respostas + matches) pra não
 * acumular dado não usado na base — o usuário vai refazer o questionário do
 * zero, agora já autenticado.
 */
export async function restartDiagnostic(userId: string): Promise<void> {
  const { error: matchesError } = await supabase.from("niche_matches").delete().eq("user_id", userId);
  if (matchesError) throw matchesError;

  const { error: diagError } = await supabase.from("diagnostic_responses").delete().eq("user_id", userId);
  if (diagError) throw diagError;
}
