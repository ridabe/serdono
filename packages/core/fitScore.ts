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
}

export interface NichoParaScore {
  categoria: string;
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

/** Sobreposição entre a faixa de capital do usuário e a faixa de investimento do nicho. */
function overlapScore(userMin: number, userMax: number, nicheMin: number, nicheMax: number): number {
  const overlapStart = Math.max(userMin, nicheMin);
  const overlapEnd = Math.min(userMax, nicheMax);
  const overlap = Math.max(0, overlapEnd - overlapStart);
  const nicheSpan = nicheMax - nicheMin || 1;
  return clamp((overlap / nicheSpan) * 100);
}

function scoreFinanceiro(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.capital_disponivel) return 0;
  const capital = CAPITAL_RANGES[d.capital_disponivel];
  const capitalOverlap = overlapScore(capital.min, capital.max, n.investimento_min, n.investimento_max);

  if (d.meses_de_folego == null || !n.tempo_ate_equilibrio_meses) {
    return capitalOverlap;
  }
  const folegoScore = clamp((d.meses_de_folego / n.tempo_ate_equilibrio_meses) * 100);
  return clamp(capitalOverlap * 0.7 + folegoScore * 0.3);
}

function scorePerfil(d: DiagnosticoParaScore, n: NichoParaScore): number {
  if (!d.apetite_risco) return 50;
  // Proxy de "risco" do nicho: média entre complexidade regulatória e nível de concorrência.
  const riscoNicho = (n.complexidade_regulatoria + n.nivel_concorrencia) / 2;
  const distancia = Math.abs(d.apetite_risco - riscoNicho);
  const riscoFit = clamp(100 - distancia * 25);

  const tags = [...d.formacao, ...d.experiencia].map((t) => t.toLowerCase());
  const categoria = n.categoria.toLowerCase();
  const bonusExperiencia = tags.some((t) => t.includes(categoria) || categoria.includes(t)) ? 15 : 0;

  return clamp(riscoFit + bonusExperiencia);
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
