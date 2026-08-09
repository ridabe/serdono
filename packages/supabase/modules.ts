import { supabase } from "./client";
import type { Tables } from "./types";

export type ModuleRow = Tables<"modules">;

/**
 * Framework de módulos (SDD-30/PRD §12.1) — catálogo (`modules`) + liberação
 * por usuário (`user_modules`), independente de plano pago. Todas as
 * operações aqui passam por RLS direto (sem Edge Function): admin tem
 * policy `for all` via claim JWT, cliente só lê a própria liberação.
 *
 * Toda conta nova já nasce com todos os módulos do catálogo habilitados
 * (SDD-73, trigger em `auth.users` — não faz parte deste arquivo). As
 * funções abaixo continuam sendo o único jeito de alterar isso depois:
 * o admin liga/desliga por conta a qualquer momento, sem limite nenhum.
 */

// ---- Catálogo (admin) ----

export async function listModules(): Promise<ModuleRow[]> {
  const { data, error } = await supabase.from("modules").select("*").order("ordem").order("nome");
  if (error) throw error;
  return data;
}

export async function createModule(params: { slug: string; nome: string; descricao?: string }): Promise<void> {
  const { error } = await supabase.from("modules").insert(params);
  if (error) throw error;
}

export async function setModuleAtivo(moduleId: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("modules").update({ ativo }).eq("id", moduleId);
  if (error) throw error;
}

// ---- Liberação por usuário (admin gerencia, cliente só lê a própria) ----

export interface ModuleAccessRow extends ModuleRow {
  habilitado: boolean;
}

/** Catálogo inteiro + estado de liberação de um usuário específico, pro admin montar os toggles. */
export async function listUserModuleAccess(userId: string): Promise<ModuleAccessRow[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("*, user_modules(habilitado)")
    .eq("user_modules.user_id", userId)
    .order("ordem")
    .order("nome");
  if (error) throw error;
  return (data as (ModuleRow & { user_modules: { habilitado: boolean }[] })[]).map((m) => ({
    ...m,
    habilitado: m.user_modules[0]?.habilitado ?? false,
  }));
}

export async function setModuleAccess(userId: string, moduleId: string, habilitado: boolean): Promise<void> {
  const { error } = await supabase
    .from("user_modules")
    .upsert({ user_id: userId, module_id: moduleId, habilitado }, { onConflict: "user_id,module_id" });
  if (error) throw error;
}

// ---- Cliente: só os próprios módulos liberados e ativos ----

export interface MyModule {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
}

export async function listMyModules(userId: string): Promise<MyModule[]> {
  const { data, error } = await supabase
    .from("user_modules")
    .select("modules(id, slug, nome, descricao, ativo)")
    .eq("user_id", userId)
    .eq("habilitado", true)
    .eq("modules.ativo", true);
  if (error) throw error;
  return (data as unknown as { modules: MyModule & { ativo: boolean } }[])
    .map((row) => row.modules)
    .filter((m) => m && m.ativo);
}

/** Checagem rápida usada no redirecionamento pós-login e nos guards de rota de módulo (SDD-31). */
export async function hasModuleAccess(userId: string, slug: string): Promise<boolean> {
  const modules = await listMyModules(userId);
  return modules.some((m) => m.slug === slug);
}

// ---- Pop-up de novidade de módulo (SDD nova, 08/08/2026) ----

// Mesmo formato de `ModuloParaNovidade` de `packages/core/novidadesModulos.ts`
// (compatível estruturalmente, sem importar de lá — `packages/supabase` não
// depende de `packages/core`, só o inverso nunca acontece; `apps/app` é quem
// já depende dos dois e passa este retorno direto pra `agruparNovidadesModulos`).
export interface ModuloComNovidade {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  anuncioGrupo: string | null;
}

/** Módulos liberados pro usuário com `novidade_vista = false` — entram na fila de pop-up da Início até serem marcados vistos. */
export async function listModulosComNovidadePendente(userId: string): Promise<ModuloComNovidade[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, slug, nome, descricao, anuncio_grupo, user_modules!inner(habilitado, novidade_vista)")
    .eq("ativo", true)
    .eq("user_modules.user_id", userId)
    .eq("user_modules.habilitado", true)
    .eq("user_modules.novidade_vista", false)
    .order("ordem");
  if (error) throw error;
  return (data as unknown as (ModuleRow & { anuncio_grupo: string | null })[]).map((m) => ({
    id: m.id,
    slug: m.slug,
    nome: m.nome,
    descricao: m.descricao,
    anuncioGrupo: m.anuncio_grupo,
  }));
}

export async function marcarNovidadesModulosVistas(userId: string, moduleIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("user_modules")
    .update({ novidade_vista: true })
    .eq("user_id", userId)
    .in("module_id", moduleIds);
  if (error) throw error;
}
