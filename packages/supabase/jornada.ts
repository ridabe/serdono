import { supabase } from "./client";
import type { Tables } from "./types";

export type JornadaInstance = Tables<"jornada_instances">;
export type JornadaDeliverable = Tables<"jornada_deliverables">;
export type JornadaDeliverableTipo = "persona" | "swot" | "canvas" | "proposta_valor";
export type JornadaFase =
  | "validacao_ideia"
  | "planejamento"
  | "formalizacao"
  | "marketing"
  | "financeiro"
  | "clientes"
  | "retencao"
  | "escala";

export type JornadaEtapaTemplate = Tables<"jornada_etapa_templates">;
export type JornadaEtapaRow = Tables<"jornada_etapas">;
export type JornadaEtapaStatus = "bloqueada" | "disponivel" | "aguardando_usuario" | "concluida";
export interface JornadaEtapa extends JornadaEtapaRow {
  template: JornadaEtapaTemplate;
}

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

/**
 * Cria a instância e semeia as `jornada_etapas` da primeira fase (SDD-33) —
 * etapas sem dependência nascem prontas pra agir (`disponivel`/
 * `aguardando_usuario` conforme o tipo); as que dependem de outra nascem
 * `bloqueada`.
 */
export async function startJornada(userId: string, nicheId: string): Promise<JornadaInstance> {
  const { data: instance, error } = await supabase
    .from("jornada_instances")
    .insert({ user_id: userId, niche_id: nicheId })
    .select("*")
    .single();
  if (error) throw error;

  const { data: templates, error: templatesError } = await supabase
    .from("jornada_etapa_templates")
    .select("*")
    .eq("fase", instance.fase_atual);
  if (templatesError) throw templatesError;

  const rows = (templates ?? []).map((t) => ({
    jornada_instance_id: instance.id,
    etapa_template_id: t.id,
    status: initialStatus(t),
  }));
  if (rows.length > 0) {
    const { error: seedError } = await supabase.from("jornada_etapas").insert(rows);
    if (seedError) throw seedError;
  }

  return instance;
}

function initialStatus(template: JornadaEtapaTemplate): JornadaEtapaStatus {
  if (template.depende_de.length > 0) return "bloqueada";
  return template.tipo_conclusao === "usuario" ? "aguardando_usuario" : "disponivel";
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

// ---- Motor de etapas (SDD-33) ----

export async function getJornadaEtapas(instanceId: string): Promise<JornadaEtapa[]> {
  const { data, error } = await supabase
    .from("jornada_etapas")
    .select("*, template:jornada_etapa_templates(*)")
    .eq("jornada_instance_id", instanceId);
  if (error) throw error;
  return (data as unknown as JornadaEtapa[]).sort((a, b) => a.template.ordem - b.template.ordem);
}

async function setEtapaStatusBySlug(instanceId: string, slug: string, status: JornadaEtapaStatus): Promise<void> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", slug)
    .single();
  if (templateError) throw templateError;

  const { error } = await supabase
    .from("jornada_etapas")
    .update({ status, concluido_em: status === "concluida" ? new Date().toISOString() : null })
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id);
  if (error) throw error;
}

/** Destrava etapas cujas dependências acabaram de ficar todas `concluida`. */
async function refreshEtapaUnlocks(instanceId: string): Promise<void> {
  const etapas = await getJornadaEtapas(instanceId);
  const concluidaIds = new Set(etapas.filter((e) => e.status === "concluida").map((e) => e.etapa_template_id));

  for (const etapa of etapas) {
    if (etapa.status !== "bloqueada") continue;
    const desbloqueou = etapa.template.depende_de.every((id) => concluidaIds.has(id));
    if (!desbloqueou) continue;

    const status: JornadaEtapaStatus = etapa.template.tipo_conclusao === "usuario" ? "aguardando_usuario" : "disponivel";
    const { error } = await supabase.from("jornada_etapas").update({ status }).eq("id", etapa.id);
    if (error) throw error;
  }
}

/** Etapa manual (RN-9-like: ação no mundo real, não um campo) — o empreendedor marca no próprio tempo. */
export async function markEtapaDone(instanceId: string, slug: string): Promise<void> {
  await setEtapaStatusBySlug(instanceId, slug, "concluida");
  await refreshEtapaUnlocks(instanceId);
}

export async function unmarkEtapaDone(instanceId: string, slug: string): Promise<void> {
  await setEtapaStatusBySlug(instanceId, slug, "aguardando_usuario");
}

// ---- Fase 2 — Validação da Ideia (SDD-32/33) ----

const CAMPO_PARA_SLUG: Record<"publico_alvo" | "concorrentes" | "diferenciais", string> = {
  publico_alvo: "validacao_publico_alvo",
  concorrentes: "validacao_concorrentes",
  diferenciais: "validacao_diferenciais",
};

/**
 * 3 inputs curtos que alimentam a geração dos documentos por IA — cada campo
 * preenchido marca a `jornada_etapas` correspondente como `concluida` (fonte
 * única de verdade do checklist, SDD-33; antes era derivado só no client).
 */
export async function updateValidacaoInputs(
  instanceId: string,
  fields: Partial<Pick<JornadaInstance, "publico_alvo" | "concorrentes" | "diferenciais">>
): Promise<void> {
  const { error } = await supabase.from("jornada_instances").update(fields).eq("id", instanceId);
  if (error) throw error;

  for (const campo of Object.keys(fields) as (keyof typeof CAMPO_PARA_SLUG)[]) {
    const preenchido = Boolean(fields[campo]?.trim());
    await setEtapaStatusBySlug(instanceId, CAMPO_PARA_SLUG[campo], preenchido ? "concluida" : "disponivel");
  }
  await refreshEtapaUnlocks(instanceId);
}

export async function getDeliverables(instanceId: string): Promise<JornadaDeliverable[]> {
  const { data, error } = await supabase.from("jornada_deliverables").select("*").eq("jornada_instance_id", instanceId);
  if (error) throw error;
  return data;
}

export async function generateDeliverables(instanceId: string): Promise<JornadaDeliverable[]> {
  const { error } = await supabase.functions.invoke("jornada-gerar-documentos", {
    body: { jornada_instance_id: instanceId },
  });
  if (error) throw error;

  await setEtapaStatusBySlug(instanceId, "validacao_persona", "concluida");
  await refreshEtapaUnlocks(instanceId);
  return getDeliverables(instanceId);
}

export async function advanceFase(instanceId: string, fase: JornadaFase): Promise<void> {
  const { error } = await supabase.from("jornada_instances").update({ fase_atual: fase }).eq("id", instanceId);
  if (error) throw error;
}
