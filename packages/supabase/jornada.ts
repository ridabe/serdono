import { supabase } from "./client";
import type { Json, Tables } from "./types";

export type JornadaInstance = Tables<"jornada_instances">;
export type JornadaDeliverable = Tables<"jornada_deliverables">;
export type JornadaDeliverableTipo = "persona" | "swot" | "canvas" | "proposta_valor";
export type JornadaFase =
  | "validacao_ideia"
  | "planejamento"
  | "formalizacao"
  | "marketing"
  | "financeiro"
  | "estrutura"
  | "fornecedores"
  | "produto"
  | "clientes"
  | "primeira_venda"
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

  await seedEtapasForFase(instance.id, instance.fase_atual as JornadaFase);

  return instance;
}

/**
 * Semeia as `jornada_etapas` de uma fase para a instância, se ainda não
 * existirem (idempotente — chamada tanto na criação da instância quanto em
 * todo avanço de fase, SDD-36). Sem isso, `advanceFase` só trocava
 * `fase_atual` e a fase nova ficava sem nenhuma etapa própria.
 *
 * `aplicaSe` (SDD-38): a fase "formalizacao" bifurca por regime (MEI vs
 * empresa formal) — sem esse argumento, semeia só os templates com
 * `aplica_se is null` (a própria pergunta do regime); passando o regime
 * escolhido, semeia também os templates daquele caminho.
 */
async function seedEtapasForFase(instanceId: string, fase: JornadaFase, aplicaSe?: string): Promise<void> {
  let query = supabase.from("jornada_etapa_templates").select("*").eq("fase", fase);
  query = aplicaSe ? query.or(`aplica_se.is.null,aplica_se.eq.${aplicaSe}`) : query.is("aplica_se", null);
  const { data: templates, error: templatesError } = await query;
  if (templatesError) throw templatesError;
  if (!templates || templates.length === 0) return;

  const { data: existentes, error: existentesError } = await supabase
    .from("jornada_etapas")
    .select("etapa_template_id")
    .eq("jornada_instance_id", instanceId)
    .in(
      "etapa_template_id",
      templates.map((t) => t.id)
    );
  if (existentesError) throw existentesError;
  const jaExistem = new Set((existentes ?? []).map((e) => e.etapa_template_id));

  const rows = templates
    .filter((t) => !jaExistem.has(t.id))
    .map((t) => ({
      jornada_instance_id: instanceId,
      etapa_template_id: t.id,
      status: initialStatus(t),
    }));
  if (rows.length > 0) {
    const { error: seedError } = await supabase.from("jornada_etapas").insert(rows);
    if (seedError) throw seedError;
  }
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

/**
 * Semeia ANTES de trocar `fase_atual` (ordem importa, bug real de produção
 * 30/07/2026): se `seedEtapasForFase` falhasse depois de `fase_atual` já
 * atualizado, a instância ficava "avançada mas sem etapas" — toda etapa
 * seguinte que depende de `jornada_etapas` existir (ex.: salvar respostas do
 * questionário de Identidade Visual) passava a falhar silenciosamente, sem
 * jeito de destravar pela própria tela. Com a semeadura primeiro, uma falha
 * aqui mantém `fase_atual` no valor antigo — o usuário só vê o erro e tenta
 * de novo, nunca fica com estado inconsistente no banco.
 */
export async function advanceFase(instanceId: string, fase: JornadaFase): Promise<void> {
  await seedEtapasForFase(instanceId, fase);
  const { error } = await supabase.from("jornada_instances").update({ fase_atual: fase }).eq("id", instanceId);
  if (error) throw error;
}

// ---- Fase 3 — Planejamento: Nome da Empresa (SDD-34) ----

export interface CandidatoNomeEmpresa {
  nome: string;
  slug: string;
  dominio_com_br: { disponivel: boolean | null };
  dominio_com: { disponivel: boolean | null };
  instagram: { disponivel: boolean | null };
}

/** IA gera 10 nomes a partir de palavras-chave e checa domínio/Instagram de cada um. */
export async function generateNomesEmpresa(instanceId: string, palavrasChave: string[]): Promise<CandidatoNomeEmpresa[]> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-nomes", {
    body: { jornada_instance_id: instanceId, palavras_chave: palavrasChave },
  });
  if (error) throw error;
  return (data as { candidatos: CandidatoNomeEmpresa[] }).candidatos;
}

export async function getNomesEmpresa(
  instanceId: string
): Promise<{ palavras_chave: string[]; candidatos: CandidatoNomeEmpresa[] } | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "nomes_empresa")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as { palavras_chave: string[]; candidatos: CandidatoNomeEmpresa[] }) ?? null;
}

/** Escolha final do nome — ação do usuário, conclui a etapa (tipo_conclusao 'usuario'). */
export async function chooseNomeEmpresa(instanceId: string, nome: string): Promise<void> {
  const { error } = await supabase
    .from("jornada_instances")
    .update({ nome_empresa_escolhido: nome })
    .eq("id", instanceId);
  if (error) throw error;
  await markEtapaDone(instanceId, "planejamento_nome_empresa");
}

// ---- Fase 3 — Planejamento: Identidade Visual (SDD-35) ----

const IDENTIDADE_VISUAL_BUCKET = "identidade-visual";

export interface IdentidadeVisualRespostas {
  valores: string[];
  personalidade: string[];
  tom_comunicacao: string;
  cores_preferidas: string[];
  cores_evitar: string[];
}

export type LogoEstilo = "minimalista" | "moderno" | "classico";

export interface LogoCandidato {
  estilo: LogoEstilo;
  imagem_base64: string;
}

/** IA gera slogan + 3 rascunhos de logo (qualidade baixa) a partir do questionário. */
export async function generateIdentidadeVisual(
  instanceId: string,
  respostas: IdentidadeVisualRespostas
): Promise<{ slogan: string; candidatos: LogoCandidato[] }> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-identidade", {
    body: { jornada_instance_id: instanceId, respostas },
  });
  if (error) throw error;
  return data as { slogan: string; candidatos: LogoCandidato[] };
}

export async function getIdentidadeVisual(
  instanceId: string
): Promise<{ slogan: string; candidatos: LogoCandidato[] } | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "identidade_visual")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as { slogan: string; candidatos: LogoCandidato[] }) ?? null;
}

/** Regenera o estilo escolhido em qualidade alta, salva no Storage e conclui a etapa. */
export async function chooseLogoFinal(instanceId: string, estilo: LogoEstilo): Promise<string> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-logo-final", {
    body: { jornada_instance_id: instanceId, estilo },
  });
  if (error) throw error;
  await markEtapaDone(instanceId, "planejamento_identidade_visual");
  return (data as { logo_path: string }).logo_path;
}

/** URL assinada (bucket privado) para o usuário baixar o próprio logo quando quiser. */
export async function getLogoDownloadUrl(logoPath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(IDENTIDADE_VISUAL_BUCKET).createSignedUrl(logoPath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ---- Fase 5 — Formalização (SDD-38) ----

export type RegimeFormalizacao = "mei" | "formal";

export interface FormalizacaoDocumento {
  nome: string;
  como_obter: string;
}

const SLUG_FORMALIZACAO_REGIME = "formalizacao_regime";

/**
 * Resposta à pergunta "qual o formato da sua empresa?" — decide o regime e
 * semeia as etapas daquele caminho (MEI: 3 etapas; formal: 9 etapas). Pode
 * ser respondida de novo a qualquer momento (nenhuma etapa desta fase trava
 * outra, SDD-38) — reescolher não apaga etapas já semeadas do caminho
 * anterior, só passa a exibir/contar o caminho atual (ver `JornadaScreen`).
 */
export async function chooseRegimeFormalizacao(instanceId: string, regime: RegimeFormalizacao): Promise<void> {
  const { error } = await supabase.from("jornada_instances").update({ regime_formalizacao: regime }).eq("id", instanceId);
  if (error) throw error;
  await seedEtapasForFase(instanceId, "formalizacao", regime);
  await markEtapaDone(instanceId, SLUG_FORMALIZACAO_REGIME);
}

// ---- Fase Financeiro — Planejamento Financeiro (SDD-39) ----

const SLUG_FINANCEIRO_PLANEJAMENTO = "financeiro_planejamento";

/** Mesmo formato de `FinanceiroInputs` em `packages/core/financeiro.ts` — duplicado aqui de propósito: `packages/supabase` não depende de `packages/core` (só `apps/app` depende dos dois). */
export interface FinanceiroDados {
  capitalDisponivel: number;
  investimentoInicial: number;
  custosFixosMensais: number;
  receitaMensalEsperada: number;
  margemContribuicaoPct: number;
  mesesCapitalGiro: number;
  mesesReserva: number;
}

/** Salva os valores que o usuário ajustou na calculadora — não marca a etapa como concluída (isso é ação separada, `markEtapaDone`). */
export async function saveFinanceiroDados(instanceId: string, dados: FinanceiroDados): Promise<void> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", SLUG_FINANCEIRO_PLANEJAMENTO)
    .single();
  if (templateError) throw templateError;

  const { error } = await supabase
    .from("jornada_etapas")
    .update({ dados_usuario: dados as unknown as Json })
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id);
  if (error) throw error;
}

// ---- Fase Clientes — Captação de Clientes (SDD-45) ----

const SLUG_CLIENTES_META = "clientes_meta";

/** Mesmo formato de `MetaCaptacaoInputs` em `packages/core/metaCaptacao.ts` — duplicado de propósito, mesmo motivo de `FinanceiroDados`/`ProdutoPrecificacaoDados` acima. */
export interface MetaCaptacaoDados {
  metaClientes: number;
  periodoDias: number;
  ticketMedio: number;
  taxaConversaoPct: number;
}

/** Salva a meta ajustada pelo usuário e já marca a etapa como concluída — diferente de Financeiro/Produto, aqui preencher a meta É a conclusão da etapa, não uma ação separada (mesmo espírito de `chooseNomeEmpresa`). */
export async function saveMetaCaptacao(instanceId: string, dados: MetaCaptacaoDados): Promise<void> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", SLUG_CLIENTES_META)
    .single();
  if (templateError) throw templateError;

  const { error } = await supabase
    .from("jornada_etapas")
    .update({ dados_usuario: dados as unknown as Json })
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id);
  if (error) throw error;

  await markEtapaDone(instanceId, SLUG_CLIENTES_META);
}

/**
 * Lê a meta de captação já salva na Fase Clientes — usado pela Fase Primeira
 * Venda pra comparar o valor real da venda com o ticket médio estimado
 * (dado real contra dado real, nunca uma estimativa nova inventada). `null`
 * se o empreendedor nunca chegou a salvar uma meta.
 */
export async function getMetaCaptacaoSalva(instanceId: string): Promise<MetaCaptacaoDados | null> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", SLUG_CLIENTES_META)
    .single();
  if (templateError) throw templateError;

  const { data, error } = await supabase
    .from("jornada_etapas")
    .select("dados_usuario")
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id)
    .maybeSingle();
  if (error) throw error;

  const dados = data?.dados_usuario as unknown as Partial<MetaCaptacaoDados> | undefined;
  return dados && dados.metaClientes != null ? (dados as MetaCaptacaoDados) : null;
}

// ---- Fase Primeira Venda (SDD-47) ----

export const SLUG_PRIMEIRA_VENDA_REGISTRO = "primeira_venda_registro";

export interface PrimeiraVendaDados {
  /** Qual contato da lista pessoal (`jornada_clientes_contatos`, status `cliente`) foi a primeira venda — `null` se o empreendedor preferir não vincular. */
  contatoId: string | null;
  /** Valor da venda, em R$ — opcional, nunca obrigatório (RN-1, baixa fricção). */
  valor: number | null;
}

/** Salva o registro e já marca a etapa como concluída — preencher o registro É a conclusão, mesmo espírito de `saveMetaCaptacao`. */
export async function savePrimeiraVenda(instanceId: string, dados: PrimeiraVendaDados): Promise<void> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", SLUG_PRIMEIRA_VENDA_REGISTRO)
    .single();
  if (templateError) throw templateError;

  const { error } = await supabase
    .from("jornada_etapas")
    .update({ dados_usuario: dados as unknown as Json })
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id);
  if (error) throw error;

  await markEtapaDone(instanceId, SLUG_PRIMEIRA_VENDA_REGISTRO);
}

// ---- Fase 7 — Estrutura (SDD-40) ----

export interface NicheEstruturaInfo {
  categoria: string | null;
  dependencia_ponto_fisico: boolean | null;
}

/** Só os 2 campos de `niches` usados pra calcular relevância do checklist de Estrutura. */
export async function getNicheEstruturaInfo(nicheId: string): Promise<NicheEstruturaInfo | null> {
  const { data, error } = await supabase
    .from("niches")
    .select("categoria, dependencia_ponto_fisico")
    .eq("id", nicheId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Um item do checklist de Estrutura é essencial pro nicho, a menos que um
 * dos critérios de dispensa (dado de configuração na própria
 * `jornada_etapa_templates`, curado por quem edita o conteúdo — não uma
 * regra fixa no código) bata com o nicho escolhido. Sem dado de nicho
 * (`niche` null), mostra tudo — comportamento seguro.
 */
export function isEtapaEstruturaRelevante(template: JornadaEtapaTemplate, niche: NicheEstruturaInfo | null): boolean {
  if (!niche) return true;
  if (template.dispensavel_sem_ponto_fisico && niche.dependencia_ponto_fisico === false) return false;
  if (niche.categoria && template.dispensavel_categorias.includes(niche.categoria)) return false;
  return true;
}

// ---- Fase 9 — Produto (SDD-42) ----

const SLUG_PRODUTO_CADASTRO = "produto_cadastro";

/** Mesmo formato de `PrecificacaoInputs` em `packages/core/precificacao.ts` — duplicado de propósito, mesmo motivo de `FinanceiroDados` acima (`packages/supabase` não depende de `packages/core`). */
export interface ProdutoPrecificacaoDados {
  custo: number;
  despesasVariaveisPct: number;
  impostosPct: number;
  margemDesejadaPct: number;
}

/** Salva os valores que o usuário ajustou na calculadora de precificação — não marca a etapa como concluída (ação separada, `markEtapaDone`). */
export async function saveProdutoDados(instanceId: string, dados: ProdutoPrecificacaoDados): Promise<void> {
  const { data: template, error: templateError } = await supabase
    .from("jornada_etapa_templates")
    .select("id")
    .eq("slug", SLUG_PRODUTO_CADASTRO)
    .single();
  if (templateError) throw templateError;

  const { error } = await supabase
    .from("jornada_etapas")
    .update({ dados_usuario: dados as unknown as Json })
    .eq("jornada_instance_id", instanceId)
    .eq("etapa_template_id", template.id);
  if (error) throw error;
}
