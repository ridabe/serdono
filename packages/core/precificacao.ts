/**
 * Calculadora de Precificação — Jornada Empreendedora, Fase 9: Produto
 * (PRD §9.8, SPEC.md SDD-42).
 *
 * Mesmo espírito de `financeiro.ts`: função pura, sem rede, recalculada a
 * cada mudança de input — resposta instantânea pra ensinar, não só entregar
 * o número.
 *
 * Fórmula usada é "precificação por margem sobre o preço de venda", não
 * "markup sobre o custo" — de propósito. Erro clássico de quem tá
 * começando: somar imposto/margem em cima do CUSTO, esquecendo que imposto
 * (Simples Nacional, ISS) e taxa de venda (maquininha, marketplace) incidem
 * sobre o PREÇO DE VENDA, não sobre o custo. Calcular assim faz o
 * empreendedor cobrar menos do que precisa e só perceber o rombo depois.
 */

export interface PrecificacaoInputs {
  /** Custo direto do produto/serviço por unidade, em R$ (matéria-prima, hora de trabalho, insumo). */
  custo: number;
  /** % do preço de venda que vai embora em taxa de venda (maquininha, marketplace, frete não repassado). */
  despesasVariaveisPct: number;
  /** % do preço de venda que vai pra imposto (ex.: alíquota efetiva do Simples/MEI sobre aquela venda). */
  impostosPct: number;
  /** % do preço de venda que o empreendedor quer que sobre de lucro líquido. */
  margemDesejadaPct: number;
}

export interface PrecificacaoResultado {
  /** Soma das 3 porcentagens — se chegar a 100 ou mais, não existe preço possível (divisão por zero/negativo). */
  percentualTotal: number;
  /** `false` quando `percentualTotal >= 100` ou `custo <= 0` — nesse caso os demais campos vêm zerados, nunca um número inventado. */
  valido: boolean;
  precoVenda: number;
  valorDespesas: number;
  valorImpostos: number;
  lucroLiquido: number;
  /** (precoVenda / custo - 1) × 100 — quanto isso equivale a um markup tradicional sobre o custo, só de referência. */
  markupEquivalentePct: number;
}

/** Todas as fórmulas da Calculadora de Precificação — puras, recalculadas a cada mudança de input. */
export function calcularPrecificacao(inputs: PrecificacaoInputs): PrecificacaoResultado {
  const { custo, despesasVariaveisPct, impostosPct, margemDesejadaPct } = inputs;

  const percentualTotal = despesasVariaveisPct + impostosPct + margemDesejadaPct;
  const valido = custo > 0 && percentualTotal < 100;

  if (!valido) {
    return { percentualTotal, valido, precoVenda: 0, valorDespesas: 0, valorImpostos: 0, lucroLiquido: 0, markupEquivalentePct: 0 };
  }

  // Preço de venda = Custo ÷ (1 − soma das porcentagens ÷ 100) — cada
  // porcentagem incide sobre o próprio preço de venda, não sobre o custo.
  const precoVenda = custo / (1 - percentualTotal / 100);

  return {
    percentualTotal,
    valido,
    precoVenda: Math.round(precoVenda * 100) / 100,
    valorDespesas: Math.round(precoVenda * (despesasVariaveisPct / 100) * 100) / 100,
    valorImpostos: Math.round(precoVenda * (impostosPct / 100) * 100) / 100,
    lucroLiquido: Math.round(precoVenda * (margemDesejadaPct / 100) * 100) / 100,
    markupEquivalentePct: Math.round(((precoVenda / custo - 1) * 100) * 10) / 10,
  };
}
