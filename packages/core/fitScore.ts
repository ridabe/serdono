/**
 * Motor de Fit Score — PRD §5.3, Documento de Conceito §5.2.
 *
 * O Fit Score é uma nota CALCULADA (0-100), nunca gerada por IA — a IA só
 * explica o resultado em linguagem natural depois (RN glossário, "Fit Score").
 * Função pura e testável sem rede, para poder rodar tanto no cliente quanto
 * na Edge Function (SPEC §3, SDD-3).
 *
 * Pesos e proxies aqui são a primeira versão do motor — o Documento de
 * Conceito define os 4 componentes mas não a fórmula exata; esta é a
 * implementação de referência, revisável conforme dado real de uso.
 */

export type CapitalFaixa = "ate_5k" | "5k_15k" | "15k_40k" | "mais_40k";
export type TempoDisponivel = "integral" | "parcial" | "paralelo_emprego";

export interface DiagnosticoParaScore {
  capital_disponivel: CapitalFaixa | null;
  meses_de_folego: number | null;
  apetite_risco: number | null; // 1-5
  tempo_disponivel: TempoDisponivel | null;
  formacao: string[];
  experiencia: string[];
  /**
   * Áreas que a IA extraiu do texto livre do diagnóstico (SDD-66, RN-37).
   * Entram no cálculo de interesse com o MESMO peso das áreas marcadas no
   * checkbox — a IA amplia o sinal de perfil, nunca decide ou recalcula a
   * nota. Quem chama a IA é a Edge Function; esta função continua pura.
   */
  areas_inferidas?: string[];
}

export interface NichoParaScore {
  categoria: string;
  /**
   * Áreas do diagnóstico que este nicho atende (SDD-66). Um nicho pode
   * pertencer a mais de uma ("Agência de marketing digital" é tecnologia E
   * serviços), coisa que a `categoria` única não conseguia expressar — e que
   * fazia nicho digital ficar escondido sob 'serviços' (defeito corrigido
   * pontualmente na SDD-65, resolvido de vez aqui). Vazio = usa `categoria`.
   */
  areas_afinidade?: string[];
  investimento_min: number;
  investimento_max: number;
  tempo_ate_equilibrio_meses: number | null;
  complexidade_regulatoria: number; // 1-5
  intensidade_mao_de_obra: number; // 1-5
  nivel_concorrencia: number; // 1-5
}

export interface FitScoreResult {
  fit_score: number;
  score_perfil: number;
  score_financeiro: number;
  score_contexto: number;
  score_tempo: number;
}

// Pesos dos 4 componentes — capital pesa mais porque é o maior filtro de
// viabilidade real para a persona primária (PRD §2.1, capital entre R$3-15 mil).
const WEIGHTS = { perfil: 0.3, financeiro: 0.35, contexto: 0.15, tempo: 0.2 } as const;

const CAPITAL_RANGES: Record<CapitalFaixa, { min: number; max: number }> = {
  ate_5k: { min: 0, max: 5_000 },
  "5k_15k": { min: 5_000, max: 15_000 },
  "15k_40k": { min: 15_000, max: 40_000 },
  mais_40k: { min: 40_000, max: Number.POSITIVE_INFINITY },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Piso do score de capital para quem consegue começar, mas sem folga nenhuma. */
const CAPITAL_SO_DA_PRA_COMECAR = 70;

/**
 * Quanto o capital do usuário dá conta do investimento do nicho.
 *
 * A pergunta é "você consegue bancar este negócio?", nunca "suas faixas
 * coincidem?". A versão anterior media a SOBREPOSIÇÃO entre a faixa de
 * capital e a faixa de investimento — o que fazia sobrar dinheiro virar
 * penalidade: quem tinha mais de R$ 40 mil tirava ZERO em "Serviço digital"
 * (R$ 300 a R$ 5.000), porque as faixas não se cruzavam. Com 5 nichos isso
 * ficava mascarado; com o catálogo inteiro ativo (SDD-66), passou a mandar no
 * resultado e empurrava perfis de tecnologia pra lavanderia e escola infantil.
 * Ter capital de sobra nunca é desencaixe.
 */
function scoreCapital(capitalMax: number, n: NichoParaScore): number {
  // Banca até o teto do nicho — cabe no bolso com folga.
  if (capitalMax >= n.investimento_max) return 100;

  // Banca pelo menos o piso: dá pra começar. Quanto mais da faixa o dinheiro
  // cobre, mais confortável — mas começar já vale a maior parte da nota.
  if (capitalMax >= n.investimento_min) {
    const faixa = n.investimento_max - n.investimento_min || 1;
    const cobertura = (capitalMax - n.investimento_min) / faixa;
    return clamp(CAPITAL_SO_DA_PRA_COMECAR + cobertura * (100 - CAPITAL_SO_DA_PRA_COMECAR));
  }

  // Não alcança nem o investimento mínimo — aí sim é desencaixe real,
  // proporcional ao quanto falta.
  return clamp((capitalMax / n.investimento_min) * CAPITAL_SO_DA_PRA_COMECAR);
}

function scoreFinanceiro(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.capital_disponivel) return 0;
  const capital = CAPITAL_RANGES[d.capital_disponivel];
  const capitalScore = scoreCapital(capital.max, n);

  if (d.meses_de_folego == null || !n.tempo_ate_equilibrio_meses) {
    return capitalScore;
  }
  const folegoScore = clamp((d.meses_de_folego / n.tempo_ate_equilibrio_meses) * 100);
  return clamp(capitalScore * 0.7 + folegoScore * 0.3);
}

/** Nenhum dado de área de interesse informado — nem penaliza nem favorece nicho nenhum. */
const AREA_SEM_DADO = 50;
/** Área de formação/experiência do usuário bate com a categoria do nicho. */
const AREA_COM_MATCH = 100;
/** Usuário informou área(s) de interesse, mas nenhuma bate com este nicho — sinal fraco, não elimina o nicho (RN de sensibilidade sem exclusividade, ver PRD §8). */
const AREA_SEM_MATCH = 25;

/**
 * Aderência entre a(s) área(s) que o usuário demonstrou interesse — marcadas
 * no bloco "Experiência" do diagnóstico, mais as que a IA inferiu do texto
 * livre (SDD-66) — e as áreas que o nicho atende.
 *
 * Antes disso vivia como um bônus fixo de +15 dentro de `scorePerfil`,
 * dependente de `apetite_risco` estar preenchido e diluído por um peso de
 * 30% no fit_score final — na prática, irrelevante pro resultado (o
 * empreendedor que só marcou "Tecnologia / digital" via nicho de comércio de
 * bairro no topo da lista). Virou o próprio eixo, ponderado 50/50 com o
 * ajuste de risco dentro de `scorePerfil`.
 */
function scoreInteresse(d: DiagnosticoParaScore, n: NichoParaScore): number {
  const tags = [...d.formacao, ...d.experiencia, ...(d.areas_inferidas ?? [])]
    .map((t) => t.toLowerCase().trim())
    .filter(Boolean);
  if (tags.length === 0) return AREA_SEM_DADO;

  // `areas_afinidade` é a fonte de verdade quando existe; `categoria` fica
  // como fallback pra nicho que ainda não foi mapeado (nenhum fica pior que antes).
  const areasDoNicho = (n.areas_afinidade?.length ? n.areas_afinidade : [n.categoria])
    .map((a) => a.toLowerCase().trim())
    .filter(Boolean);

  const match = tags.some((t) => areasDoNicho.some((a) => t === a || t.includes(a) || a.includes(t)));
  return match ? AREA_COM_MATCH : AREA_SEM_MATCH;
}

function scorePerfil(d: DiagnosticoParaScore, n: NichoParaScore): number {
  // Proxy de "risco" do nicho: média entre complexidade regulatória e nível de concorrência.
  const riscoNicho = (n.complexidade_regulatoria + n.nivel_concorrencia) / 2;
  const riscoFit = d.apetite_risco ? clamp(100 - Math.abs(d.apetite_risco - riscoNicho) * 25) : 50;

  return clamp(riscoFit * 0.5 + scoreInteresse(d, n) * 0.5);
}

function scoreContexto(n: NichoParaScore): number {
  // Placeholder honesto até existir inteligência regional real (Documento §7.1,
  // "camada de inteligência regional") — usa nível de concorrência do nicho
  // como único proxy disponível hoje. Revisar quando houver dado por cidade.
  return clamp((6 - n.nivel_concorrencia) * 20);
}

function scoreTempo(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.tempo_disponivel) return 50;
  const disponibilidade: Record<TempoDisponivel, number> = {
    integral: 3,
    parcial: 2,
    paralelo_emprego: 1,
  };
  const exigido = n.intensidade_mao_de_obra >= 4 ? 3 : n.intensidade_mao_de_obra >= 2 ? 2 : 1;
  const gap = disponibilidade[d.tempo_disponivel] - exigido;

  if (gap >= 0) return 100;
  if (gap === -1) return 60;
  return 20;
}

export function calculateFitScore(diagnostico: DiagnosticoParaScore, nicho: NichoParaScore): FitScoreResult {
  const score_perfil = scorePerfil(diagnostico, nicho);
  const score_financeiro = scoreFinanceiro(diagnostico, nicho);
  const score_contexto = scoreContexto(nicho);
  const score_tempo = scoreTempo(diagnostico, nicho);

  const fit_score = clamp(
    score_perfil * WEIGHTS.perfil +
      score_financeiro * WEIGHTS.financeiro +
      score_contexto * WEIGHTS.contexto +
      score_tempo * WEIGHTS.tempo
  );

  return {
    fit_score: Math.round(fit_score),
    score_perfil: Math.round(score_perfil),
    score_financeiro: Math.round(score_financeiro),
    score_contexto: Math.round(score_contexto),
    score_tempo: Math.round(score_tempo),
  };
}
