/**
 * Retenção de Clientes — módulo do catálogo (PRD §12.5, SPEC.md SDD-54).
 *
 * Mesmo espírito de `financeiro.ts`/`metaCaptacao.ts`: funções puras, sem
 * rede, recalculadas a cada mudança — aqui elas respondem a única pergunta
 * que o módulo existe pra responder ("quem está prestes a sumir?") a partir
 * de datas que o empreendedor registrou de fato.
 *
 * Duas regras que atravessam este arquivo:
 *
 * 1. **O ciclo é do negócio, não nosso.** Salão de beleza e consultoria não
 *    compartilham a mesma noção de "sumiu" — todas as faixas derivam do
 *    `cicloRecompraDias` que o próprio empreendedor informou. Não existe aqui
 *    nenhum corte fixo de 30/60/90 dias.
 * 2. **Sem dado, sem afirmação.** Cliente que nunca teve interação registrada
 *    é `sem_historico`, nunca `sumido` — o produto não sabe se ele sumiu, só
 *    sabe que ninguém anotou nada (PRD §4).
 */

export type SituacaoCliente = "em_dia" | "esfriando" | "sumido" | "sem_historico";

export interface ClienteParaClassificar {
  id: string;
  /** Data (ISO, `YYYY-MM-DD`) da interação mais recente; null quando não há nenhuma. */
  ultimaInteracaoEm: string | null;
  /** Quantas compras o cliente já fez — usado pela taxa de retorno. */
  totalCompras: number;
}

export interface ClienteClassificado {
  id: string;
  situacao: SituacaoCliente;
  /** Dias desde a última interação; null quando não há histórico. */
  diasSemContato: number | null;
}

/**
 * Multiplicador do ciclo a partir do qual o cliente é considerado perdido de
 * vista. Entre 1× e 1,5× do ciclo ele está "esfriando" — já passou do que era
 * esperado, mas ainda dentro de uma margem em que uma mensagem soa natural.
 * Acima de 1,5× vira "sumido".
 *
 * Uma faixa intermediária existe de propósito: um módulo que só dissesse
 * "em dia" ou "sumido" avisaria tarde demais — quando o cliente já foi.
 */
const FATOR_SUMIDO = 1.5;

/** Diferença em dias inteiros entre duas datas, ignorando hora. */
function diasEntre(deISO: string, ateISO: string): number {
  const de = new Date(`${deISO}T00:00:00Z`).getTime();
  const ate = new Date(`${ateISO}T00:00:00Z`).getTime();
  return Math.floor((ate - de) / 86_400_000);
}

/** Data de hoje em ISO (`YYYY-MM-DD`), no formato que as interações usam. */
export function hojeISO(referencia: Date = new Date()): string {
  return referencia.toISOString().slice(0, 10);
}

export function classificarCliente(
  cliente: ClienteParaClassificar,
  cicloRecompraDias: number,
  hoje: string
): ClienteClassificado {
  if (!cliente.ultimaInteracaoEm) {
    return { id: cliente.id, situacao: "sem_historico", diasSemContato: null };
  }

  // Interação com data futura (o empreendedor agendou ou digitou errado) conta
  // como zero dias — nunca um número negativo vazando pra tela.
  const diasSemContato = Math.max(0, diasEntre(cliente.ultimaInteracaoEm, hoje));
  const limiteSumido = cicloRecompraDias * FATOR_SUMIDO;

  const situacao: SituacaoCliente =
    diasSemContato > limiteSumido ? "sumido" : diasSemContato > cicloRecompraDias ? "esfriando" : "em_dia";

  return { id: cliente.id, situacao, diasSemContato };
}

export interface ResumoRetencao {
  total: number;
  emDia: number;
  esfriando: number;
  sumidos: number;
  semHistorico: number;
  /**
   * % de clientes com mais de uma compra registrada. É a única métrica de
   * resultado do módulo, e é deliberadamente crua: mede o que o empreendedor
   * anotou, não uma projeção. `null` quando ninguém comprou ainda — sem base,
   * não existe taxa (dividir por zero e mostrar "0%" seria mentir sobre um
   * negócio que só não tem histórico ainda).
   */
  taxaRetornoPct: number | null;
}

export function calcularResumoRetencao(classificados: ClienteClassificado[], clientes: ClienteParaClassificar[]): ResumoRetencao {
  const porSituacao = (s: SituacaoCliente) => classificados.filter((c) => c.situacao === s).length;

  const comCompra = clientes.filter((c) => c.totalCompras > 0);
  const comRecompra = clientes.filter((c) => c.totalCompras > 1);

  return {
    total: classificados.length,
    emDia: porSituacao("em_dia"),
    esfriando: porSituacao("esfriando"),
    sumidos: porSituacao("sumido"),
    semHistorico: porSituacao("sem_historico"),
    taxaRetornoPct: comCompra.length === 0 ? null : Math.round((comRecompra.length / comCompra.length) * 100),
  };
}

/**
 * Ordem de atenção da lista: quem precisa de ação primeiro aparece primeiro.
 * Sumido antes de esfriando, e dentro de cada grupo o mais abandonado no topo.
 * `sem_historico` vai pro fim — não é urgência, é cadastro incompleto.
 */
const PESO_SITUACAO: Record<SituacaoCliente, number> = { sumido: 0, esfriando: 1, em_dia: 2, sem_historico: 3 };

export function ordenarPorAtencao(classificados: ClienteClassificado[]): ClienteClassificado[] {
  return [...classificados].sort((a, b) => {
    const peso = PESO_SITUACAO[a.situacao] - PESO_SITUACAO[b.situacao];
    if (peso !== 0) return peso;
    return (b.diasSemContato ?? 0) - (a.diasSemContato ?? 0);
  });
}

export const SITUACAO_LABEL: Record<SituacaoCliente, string> = {
  em_dia: "Em dia",
  esfriando: "Esfriando",
  sumido: "Sumido",
  sem_historico: "Sem histórico",
};

/** Ponto de partida do ciclo, só como valor inicial do campo — sempre editável. */
export const CICLO_RECOMPRA_PADRAO_DIAS = 30;
