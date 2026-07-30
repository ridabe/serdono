/**
 * Meta de Captação — Jornada Empreendedora, Fase Clientes (PRD §9.10,
 * SPEC.md SDD-45).
 *
 * Mesmo espírito de `financeiro.ts`/`precificacao.ts`: função pura, sem
 * rede, recalculada a cada mudança de input — transforma uma meta vaga
 * ("conseguir clientes") em números concretos (quanto isso representa em
 * faturamento e quantos contatos precisam ser abordados).
 *
 * A taxa de conversão é um valor de referência (20%), não uma medição real
 * do negócio do empreendedor — por isso é editável, nunca fixada em
 * silêncio.
 */

export interface MetaCaptacaoInputs {
  /** Quantos clientes o empreendedor quer conquistar no período. */
  metaClientes: number;
  /** Duração da meta, em dias. */
  periodoDias: number;
  /** Quanto o empreendedor espera faturar, em média, por cliente. */
  ticketMedio: number;
  /** % de contatos abordados que viram cliente — valor de referência, editável. */
  taxaConversaoPct: number;
}

export interface MetaCaptacaoResultado {
  faturamentoEstimado: number;
  /** Quantos contatos precisam ser abordados pra bater a meta, dada a taxa de conversão. */
  contatosNecessarios: number;
}

const TAXA_CONVERSAO_PADRAO_PCT = 20;

/** Ponto de partida editável — meta vazia até o empreendedor preencher. */
export function metaCaptacaoPadrao(): MetaCaptacaoInputs {
  return { metaClientes: 10, periodoDias: 30, ticketMedio: 0, taxaConversaoPct: TAXA_CONVERSAO_PADRAO_PCT };
}

/** Fórmulas da Meta de Captação — puras, recalculadas a cada mudança de input. */
export function calcularMetaCaptacao(inputs: MetaCaptacaoInputs): MetaCaptacaoResultado {
  const { metaClientes, ticketMedio, taxaConversaoPct } = inputs;

  const faturamentoEstimado = metaClientes * ticketMedio;
  const contatosNecessarios = taxaConversaoPct > 0 ? Math.ceil(metaClientes / (taxaConversaoPct / 100)) : 0;

  return {
    faturamentoEstimado: Math.round(faturamentoEstimado * 100) / 100,
    contatosNecessarios,
  };
}
