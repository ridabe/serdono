/**
 * Comparador de aplicações — módulo Mentoria em Investimentos (PRD §12.6,
 * SPEC.md SDD-56/SDD-57).
 *
 * A fronteira que este arquivo respeita, e que é a razão de ele existir
 * separado da tela:
 *
 * - **Renda fixa é matemática, não opinião.** Dado o CDI/Selic de hoje (que
 *   vem da HG Brasil, real), o rendimento de um CDB a X% do CDI é uma conta
 *   determinística. Projetar isso não é recomendar nada — é aritmética que o
 *   empreendedor faria na mão se soubesse a fórmula.
 * - **Renda variável não é projetável, e este arquivo não projeta.** Não
 *   existe aqui nenhuma taxa "esperada" de ação, nenhuma média histórica de
 *   Ibovespa, nenhum retorno sugerido. O cenário de renda variável é sempre
 *   um número que **o próprio usuário digitou** — a função só faz a conta em
 *   cima dele e o resultado é rotulado como cenário do usuário, nunca como
 *   previsão do produto (RN-33).
 *
 * O imposto de renda regressivo entra porque ignorá-lo faria a renda fixa
 * parecer melhor do que é — omitir IR num comparador é o tipo de silêncio que
 * engana sem mentir.
 */

export type TipoAplicacao = "cdb" | "selic" | "poupanca" | "cenario_usuario";

export interface TaxasMercado {
  /** CDI anual em % (ex.: 14.25) — vem da HG Brasil, nunca fixado no código. */
  cdiAnualPct: number;
  /** Selic anual em % (ex.: 14.25) — idem. */
  selicAnualPct: number;
}

export interface SimulacaoInputs {
  valorInicial: number;
  meses: number;
  taxas: TaxasMercado;
  /** % do CDI que o CDB paga (ex.: 100, 110). Editável — depende do banco. */
  percentualCdi: number;
  /**
   * Rentabilidade anual (%) que o usuário quer TESTAR para renda variável.
   * É hipótese dele, nunca sugestão do produto — pode ser negativa.
   */
  cenarioRendaVariavelPct: number;
}

export interface PontoProjecao {
  mes: number;
  cdb: number;
  selic: number;
  poupanca: number;
  cenarioUsuario: number;
}

export interface ResultadoAplicacao {
  tipo: TipoAplicacao;
  /** Bruto no fim do período. */
  valorFinalBruto: number;
  /** Líquido depois do IR regressivo (poupança e o cenário do usuário não sofrem essa tabela). */
  valorFinalLiquido: number;
  rendimentoLiquido: number;
  /** IR retido — 0 quando isento. */
  impostoRenda: number;
  aliquotaIrPct: number;
}

export interface ResultadoSimulacao {
  pontos: PontoProjecao[];
  cdb: ResultadoAplicacao;
  selic: ResultadoAplicacao;
  poupanca: ResultadoAplicacao;
  cenarioUsuario: ResultadoAplicacao;
}

/**
 * Tabela regressiva do IR sobre renda fixa (Lei 11.033/2004) — prazo em dias
 * corridos. Não é um número que o produto escolheu: é legislação.
 */
export function aliquotaIrPorMeses(meses: number): number {
  const dias = meses * 30;
  if (dias <= 180) return 22.5;
  if (dias <= 360) return 20;
  if (dias <= 720) return 17.5;
  return 15;
}

/** Converte taxa anual em taxa mensal equivalente (juro composto, não divisão por 12). */
export function taxaMensalDeAnual(anualPct: number): number {
  return Math.pow(1 + anualPct / 100, 1 / 12) - 1;
}

/**
 * Rendimento da poupança na regra vigente: com Selic acima de 8,5% a.a., é
 * 0,5% ao mês + TR. A TR fica de fora porque a API não a fornece e chutar um
 * valor distorceria a comparação — a tela diz isso ao usuário.
 */
export function taxaMensalPoupanca(selicAnualPct: number): number {
  return selicAnualPct > 8.5 ? 0.005 : taxaMensalDeAnual(selicAnualPct * 0.7);
}

function montar(
  tipo: TipoAplicacao,
  valorInicial: number,
  valorFinalBruto: number,
  meses: number,
  isentoIr: boolean
): ResultadoAplicacao {
  const rendimentoBruto = Math.max(0, valorFinalBruto - valorInicial);
  const aliquotaIrPct = isentoIr ? 0 : aliquotaIrPorMeses(meses);
  const impostoRenda = rendimentoBruto * (aliquotaIrPct / 100);
  const valorFinalLiquido = valorFinalBruto - impostoRenda;

  return {
    tipo,
    valorFinalBruto,
    valorFinalLiquido,
    rendimentoLiquido: valorFinalLiquido - valorInicial,
    impostoRenda,
    aliquotaIrPct,
  };
}

export function simularAplicacoes(inputs: SimulacaoInputs): ResultadoSimulacao {
  const { valorInicial, meses, taxas, percentualCdi, cenarioRendaVariavelPct } = inputs;

  const mensalCdb = taxaMensalDeAnual(taxas.cdiAnualPct * (percentualCdi / 100));
  const mensalSelic = taxaMensalDeAnual(taxas.selicAnualPct);
  const mensalPoupanca = taxaMensalPoupanca(taxas.selicAnualPct);
  // Pode ser negativa — testar prejuízo é metade da utilidade de um
  // comparador. `taxaMensalDeAnual` já resolve o caso negativo pela mesma
  // fórmula: (1 - 0,30)^(1/12) - 1 acumulado 12 vezes devolve exatamente
  // -30% no ano. Uma primeira versão tratava o negativo como caso especial
  // (espelhando a taxa positiva) e devolvia -23,4% em vez de -30% — o teste
  // de cenário negativo existe por causa disso.
  const mensalCenario =
    cenarioRendaVariavelPct <= -100 ? -1 : taxaMensalDeAnual(cenarioRendaVariavelPct);

  const pontos: PontoProjecao[] = [];
  for (let mes = 0; mes <= meses; mes++) {
    pontos.push({
      mes,
      cdb: valorInicial * Math.pow(1 + mensalCdb, mes),
      selic: valorInicial * Math.pow(1 + mensalSelic, mes),
      poupanca: valorInicial * Math.pow(1 + mensalPoupanca, mes),
      cenarioUsuario: valorInicial * Math.pow(1 + mensalCenario, mes),
    });
  }

  const ultimo = pontos[pontos.length - 1];

  return {
    pontos,
    cdb: montar("cdb", valorInicial, ultimo.cdb, meses, false),
    selic: montar("selic", valorInicial, ultimo.selic, meses, false),
    // Poupança é isenta de IR pra pessoa física — por isso ela às vezes ganha
    // de um CDB ruim, e é justamente o que o comparador precisa deixar visível.
    poupanca: montar("poupanca", valorInicial, ultimo.poupanca, meses, true),
    // O cenário do usuário não recebe a tabela regressiva: ação vendida com
    // lucro tem regra própria (15% sobre o ganho, com isenção até R$ 20 mil
    // de venda no mês). Aplicar a tabela de renda fixa aqui seria inventar.
    cenarioUsuario: montar("cenario_usuario", valorInicial, ultimo.cenarioUsuario, meses, true),
  };
}

export const APLICACAO_LABEL: Record<TipoAplicacao, string> = {
  cdb: "CDB",
  selic: "Tesouro Selic",
  poupanca: "Poupança",
  cenario_usuario: "Seu cenário",
};

/** Prazos oferecidos no seletor — os cortes coincidem com as faixas do IR. */
export const PRAZOS_MESES = [6, 12, 24, 36] as const;
