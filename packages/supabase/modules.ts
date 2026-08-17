import { supabase } from "./client";
import type { Tables } from "./types";

export type ModuleRow = Tables<"modules">;

/**
 * Framework de módulos (SDD-30/PRD §12.1) — catálogo (`modules`) + liberação
 * por usuário (`user_modules`) + gate de plano (`modules.plano_minimo` x
 * `users.plano_atual`, cobrança via AbacatePay, 17/08/2026). Todas as
 * operações aqui passam por RLS direto (sem Edge Function): admin tem
 * policy `for all` via claim JWT, cliente só lê a própria liberação.
 *
 * Toda conta nova já nasce com todos os módulos do catálogo habilitados em
 * `user_modules.habilitado` (SDD-73, trigger em `auth.users` — não faz parte
 * deste arquivo). Isso continua valendo: `habilitado` é só o toggle do
 * admin (bloqueia um usuário específico, independente do plano). O gate de
 * plano é ADITIVO — um módulo só aparece se `habilitado = true` E o plano
 * atual atender `plano_minimo`. Admin ainda não consegue liberar módulo
 * ALÉM do plano nesta versão (limitação aceita, ver SPEC).
 */

const ORDEM_PLANO: Record<string, number> = { gratuito: 0, essencial: 1, master: 2 };

/** Planos que atendem `planoAtual` (ordinal) — usado pra filtrar `modules.plano_minimo` sem importar `packages/core` (regra de camada: este pacote nunca importa de lá). */
function planosPermitidos(planoAtual: string): string[] {
  const nivel = ORDEM_PLANO[planoAtual] ?? 0;
  return Object.keys(ORDEM_PLANO).filter((p) => ORDEM_PLANO[p] <= nivel);
}

/** Plano vigente do usuário — `gratuito` se a coluna vier nula/desconhecida (nunca trava por erro de leitura). */
export async function getPlanoAtual(userId: string): Promise<string> {
  const { data, error } = await supabase.from("users").select("plano_atual").eq("id", userId).single();
  if (error) throw error;
  return data.plano_atual ?? "gratuito";
}

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

/**
 * Troca o `ordem` de dois módulos entre si (pedido do dono do produto,
 * 09/08/2026: admin poder reordenar o menu sem tocar em código). Usado pelos
 * botões "subir"/"descer" da tela `AdminModulesScreen` — dois updates em vez
 * de reescrever o `ordem` da lista inteira, então um módulo cadastrado por
 * outro admin no meio do processo não é sobrescrito por engano.
 */
export async function trocarOrdemModules(a: { id: string; ordem: number }, b: { id: string; ordem: number }): Promise<void> {
  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase.from("modules").update({ ordem: b.ordem }).eq("id", a.id),
    supabase.from("modules").update({ ordem: a.ordem }).eq("id", b.id),
  ]);
  if (errorA) throw errorA;
  if (errorB) throw errorB;
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
  // Consulta A PARTIR de `modules` (não de `user_modules`) só pra poder usar
  // `.order("ordem")` de verdade — `.order(col, {referencedTable})` NÃO
  // reordena a tabela pai, só o array embutido (doc do postgrest-js), então
  // a versão anterior (a partir de `user_modules`) sempre devolvia na ordem
  // em que o módulo foi liberado pro usuário, nunca em `modules.ordem`.
  // Achado real testando o catálogo: um módulo com `ordem = 1` aparecia por
  // último por ter sido liberado por último via backfill (SDD-90).
  const planoAtual = await getPlanoAtual(userId);
  const { data, error } = await supabase
    .from("modules")
    .select("id, slug, nome, descricao, user_modules!inner(habilitado)")
    .eq("ativo", true)
    .eq("user_modules.user_id", userId)
    .eq("user_modules.habilitado", true)
    .in("plano_minimo", planosPermitidos(planoAtual))
    .order("ordem");
  if (error) throw error;
  return (data as unknown as (MyModule & { user_modules: unknown })[]).map(({ user_modules: _um, ...m }) => m);
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
  const planoAtual = await getPlanoAtual(userId);
  const { data, error } = await supabase
    .from("modules")
    .select("id, slug, nome, descricao, anuncio_grupo, user_modules!inner(habilitado, novidade_vista)")
    .eq("ativo", true)
    .eq("user_modules.user_id", userId)
    .eq("user_modules.habilitado", true)
    .eq("user_modules.novidade_vista", false)
    .in("plano_minimo", planosPermitidos(planoAtual))
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
