/**
 * Motor de Planejamento Financeiro — Jornada Empreendedora, Fase Financeiro
 * (PRD §9.5, SPEC.md SDD-39).
 *
 * Diferente das fases anteriores (nome da empresa, identidade visual), aqui
 * NÃO existe chamada de IA — é matemática financeira padrão, calculada
 * localmente para resposta instantânea (o pedido explícito do dono do
 * produto foi "teste com outros valores, resposta imediata"). Função pura e
 * testável sem rede, mesmo padrão de `fitScore.ts` (SDD-3).
 *
 * Todo valor de saída é uma fórmula documentada abaixo — a tela mostra a
 * mesma fórmula ao lado do resultado, porque o objetivo declarado é
 * ENSINAR o empreendedor a fazer essa conta sozinho, não só entregar o
 * número pronto.
 */

import type { CapitalFaixa } from "./fitScore";

export interface FinanceiroInputs {
  /** Quanto o empreendedor tem disponível hoje, valor exato em R$. */
  capitalDisponivel: number;
  /** Gasto único pra abrir (equipamento, estoque inicial, reforma, taxas). */
  investimentoInicial: number;
  /** Custos que se repetem todo mês, independente de quanto se vende (aluguel, contas fixas, mensalidades). */
  custosFixosMensais: number;
  /** Quanto o empreendedor espera faturar por mês, em regime de cruzeiro. */
  receitaMensalEsperada: number;
  /**
   * % de cada real de receita que sobra depois dos custos variáveis (insumo,
   * comissão, frete) — ANTES de descontar os custos fixos. Ponto de partida:
   * a margem líquida típica do nicho escolhido, editável pelo usuário.
   */
  margemContribuicaoPct: number;
  /** Quantos meses de custo fixo o capital de giro precisa cobrir. */
  mesesCapitalGiro: number;
  /** Quantos meses extras de custo fixo ficam de reserva de emergência, à parte do capital de giro. */
  mesesReserva: number;
}

export interface FluxoCaixaMes {
  mes: number;
  saldo: number;
}

export interface FinanceiroResultado {
  investimentoInicial: number;
  /** capitalDisponivel - investimentoInicial: o que sobra logo após abrir. */
  saldoAposInvestimento: number;
  capitalGiro: number;
  reservaEmergencia: number;
  /** investimentoInicial + capitalGiro + reservaEmergencia. */
  totalNecessario: number;
  /** capitalDisponivel - totalNecessario. Negativo = falta dinheiro. */
  faltaOuSobra: number;
  pontoEquilibrioMensal: number;
  lucroEsperadoMensal: number;
  /** Projeção de 12 meses do saldo acumulado, começando em saldoAposInvestimento. */
  fluxoCaixa12Meses: FluxoCaixaMes[];
  /**
   * Mês (1-12) em que o saldo acumulado fica negativo, nos valores
   * informados — `null` se o saldo nunca fica negativo dentro de 12 meses.
   * É um alerta pra revisar as premissas, nunca um bloqueio (RN-23, nada
   * nesta fase trava o usuário).
   */
  mesEmQueSaldoFicaNegativo: number | null;
}

const CAPITAL_FAIXA_PARA_ESTIMATIVA: Record<CapitalFaixa, number> = {
  ate_5k: 4_000,
  "5k_15k": 10_000,
  "15k_40k": 27_500,
  // "mais_40k" não tem teto — usa um valor de referência conservador, não um chute otimista.
  mais_40k: 50_000,
};

/** Converte a faixa do diagnóstico (RN-5: sempre faixa, nunca valor livre) num valor numérico de partida, editável pelo usuário. */
export function estimarCapitalDaFaixa(faixa: CapitalFaixa | string | null | undefined): number | null {
  if (!faixa || !(faixa in CAPITAL_FAIXA_PARA_ESTIMATIVA)) return null;
  return CAPITAL_FAIXA_PARA_ESTIMATIVA[faixa as CapitalFaixa];
}

export interface SugestaoNicho {
  investimentoMin?: number | null;
  investimentoMax?: number | null;
  tempoAteEquilibrioMeses?: number | null;
  margemTipicaPct?: number | null;
}

const MARGEM_CONTRIBUICAO_PADRAO = 50;
const MESES_CAPITAL_GIRO_PADRAO = 3;
const MESES_RESERVA_PADRAO = 3;
/** Regra prática de ponto de partida: custo fixo mensal ~ 15% do investimento inicial — editável, nunca a resposta final. */
const PROPORCAO_CUSTO_FIXO_SOBRE_INVESTIMENTO = 0.15;

/**
 * Monta um conjunto inicial de valores editáveis a partir do nicho escolhido
 * e do capital informado no diagnóstico — nunca a resposta final, só o
 * ponto de partida pra calculadora (o usuário ajusta tudo).
 */
export function sugerirPlanejamentoFinanceiro(
  capitalDisponivel: number,
  nicho: SugestaoNicho | null
): FinanceiroInputs {
  const investimentoInicial =
    nicho?.investimentoMin != null && nicho?.investimentoMax != null
      ? Math.round((nicho.investimentoMin + nicho.investimentoMax) / 2)
      : Math.round(capitalDisponivel * 0.5);

  const custosFixosMensais = Math.round(investimentoInicial * PROPORCAO_CUSTO_FIXO_SOBRE_INVESTIMENTO);
  const margemContribuicaoPct = nicho?.margemTipicaPct ?? MARGEM_CONTRIBUICAO_PADRAO;

  // Ponto de partida neutro pra receita: exatamente o ponto de equilíbrio
  // (nem lucro nem prejuízo) — não fabrica uma expectativa otimista.
  const receitaMensalEsperada = Math.round(custosFixosMensais / (margemContribuicaoPct / 100));

  return {
    capitalDisponivel,
    investimentoInicial,
    custosFixosMensais,
    receitaMensalEsperada,
    margemContribuicaoPct,
    mesesCapitalGiro: nicho?.tempoAteEquilibrioMeses ?? MESES_CAPITAL_GIRO_PADRAO,
    mesesReserva: MESES_RESERVA_PADRAO,
  };
}

/** Todas as fórmulas do Planejamento Financeiro — puras, recalculadas a cada mudança de input. */
export function calcularPlanejamentoFinanceiro(inputs: FinanceiroInputs): FinanceiroResultado {
  const {
    capitalDisponivel,
    investimentoInicial,
    custosFixosMensais,
    receitaMensalEsperada,
    margemContribuicaoPct,
    mesesCapitalGiro,
    mesesReserva,
  } = inputs;

  const margem = margemContribuicaoPct / 100;

  const saldoAposInvestimento = capitalDisponivel - investimentoInicial;
  const capitalGiro = custosFixosMensais * mesesCapitalGiro;
  const reservaEmergencia = custosFixosMensais * mesesReserva;
  const totalNecessario = investimentoInicial + capitalGiro + reservaEmergencia;
  const faltaOuSobra = capitalDisponivel - totalNecessario;

  // Ponto de equilíbrio: Custos Fixos ÷ Margem de Contribuição — fórmula
  // clássica de break-even, quanto precisa faturar só pra não ter prejuízo.
  const pontoEquilibrioMensal = margem > 0 ? custosFixosMensais / margem : 0;

  // Lucro esperado: receita × margem de contribuição, menos os custos fixos.
  const lucroEsperadoMensal = receitaMensalEsperada * margem - custosFixosMensais;

  const fluxoCaixa12Meses: FluxoCaixaMes[] = [];
  let saldo = saldoAposInvestimento;
  let mesEmQueSaldoFicaNegativo: number | null = saldo < 0 ? 0 : null;
  for (let mes = 1; mes <= 12; mes++) {
    saldo += lucroEsperadoMensal;
    fluxoCaixa12Meses.push({ mes, saldo: Math.round(saldo) });
    if (mesEmQueSaldoFicaNegativo === null && saldo < 0) {
      mesEmQueSaldoFicaNegativo = mes;
    }
  }

  return {
    investimentoInicial,
    saldoAposInvestimento: Math.round(saldoAposInvestimento),
    capitalGiro: Math.round(capitalGiro),
    reservaEmergencia: Math.round(reservaEmergencia),
    totalNecessario: Math.round(totalNecessario),
    faltaOuSobra: Math.round(faltaOuSobra),
    pontoEquilibrioMensal: Math.round(pontoEquilibrioMensal),
    lucroEsperadoMensal: Math.round(lucroEsperadoMensal),
    fluxoCaixa12Meses,
    mesEmQueSaldoFicaNegativo,
  };
}
