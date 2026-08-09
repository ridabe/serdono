/**
 * Raio-X Financeiro (pedido do dono do produto, 09/08/2026) — fechamento
 * financeiro mensal simples: faturamento, despesas e retirada do sócio,
 * comparados com o mês anterior. Lógica pura (SDD-3).
 *
 * **Sem IA** (decisão do dono do produto, mesma sessão): o comentário da
 * Mary é regra determinística sobre os números reais informados abaixo —
 * mais rápido, gratuito, e sem risco de "inventar" uma tendência que os
 * números não sustentam (PRD §4 — nenhum dado apresentado como real pode
 * ser estimado).
 */

/** Mesma regra do Check-up Mensal (`elegivelCheckupMensal`) — precisa ter uma Jornada em andamento pra fazer sentido fechar o mês financeiro de um negócio. */
export function elegivelRaioXFinanceiro(jornadaExiste: boolean): boolean {
  return jornadaExiste;
}

/**
 * Dia 1º do mês anterior ao `mesReferenciaISO` informado (também dia 1º).
 * Mesma convenção usada em `checkup-gerar`/`plano-acao-gerar` — duplicada lá
 * dentro de cada Edge Function (elas não podem importar `packages/core` no
 * deploy via MCP), mas este módulo não usa Edge Function nenhuma, então a
 * versão canônica mora aqui.
 */
export function mesAnteriorISO(mesReferenciaISO: string): string {
  const [ano, mes] = mesReferenciaISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  data.setUTCMonth(data.getUTCMonth() - 1);
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function somaDespesas(despesas: { valor: number }[]): number {
  return despesas.reduce((soma, d) => soma + d.valor, 0);
}

export interface ResultadoMensal {
  faturamento: number;
  despesas: number;
  resultado: number;
  /** `null` sem faturamento registrado — nunca divide por zero nem finge uma margem. */
  margemPct: number | null;
}

export function calcularResultadoMensal(faturamento: number, despesas: number): ResultadoMensal {
  const resultado = faturamento - despesas;
  const margemPct = faturamento > 0 ? (resultado / faturamento) * 100 : null;
  return { faturamento, despesas, resultado, margemPct };
}

export type TipoInsightRaioX = "alta_faturamento" | "queda_faturamento" | "alerta_despesa" | "estavel" | "primeiro_mes";

export interface InsightRaioX {
  tipo: TipoInsightRaioX;
  texto: string;
}

/** Variação mínima (em módulo) pra virar "subiu"/"caiu" em vez de "estável" — evita comentar uma oscilação de 1-2% como se fosse tendência. */
const LIMIAR_VARIACAO_PCT = 3;

function variacaoPct(atual: number, anterior: number): number | null {
  if (anterior === 0) return null; // sem base de comparação — não divide por zero nem inventa %.
  return ((atual - anterior) / anterior) * 100;
}

function formatarPct(valor: number): string {
  return Math.abs(valor).toFixed(1).replace(".", ",");
}

/**
 * Compara o fechamento do mês atual com o anterior e escolhe UM comentário
 * — sempre a partir de números realmente registrados, nunca estimados (PRD
 * §4). Sem mês anterior, não há o que comparar: mensagem neutra de início
 * de histórico ("quanto mais meses o usuário usa, mais útil fica").
 */
export function gerarInsightRaioX(atual: ResultadoMensal, anterior: ResultadoMensal | null): InsightRaioX {
  if (!anterior) {
    return {
      tipo: "primeiro_mes",
      texto: "Esse é o seu primeiro fechamento por aqui — a partir do próximo mês eu já consigo comparar e te avisar sobre tendências.",
    };
  }

  const varFaturamento = variacaoPct(atual.faturamento, anterior.faturamento);
  const varDespesas = variacaoPct(atual.despesas, anterior.despesas);

  if (varDespesas != null && varFaturamento != null && varDespesas > varFaturamento && varDespesas > LIMIAR_VARIACAO_PCT) {
    return {
      tipo: "alerta_despesa",
      texto: "Suas despesas cresceram mais rápido que suas vendas. Vale investigar antes que isso afete sua margem.",
    };
  }

  if (varFaturamento != null && varFaturamento > LIMIAR_VARIACAO_PCT) {
    return { tipo: "alta_faturamento", texto: `Seu faturamento cresceu ${formatarPct(varFaturamento)}% em relação ao mês anterior.` };
  }

  if (varFaturamento != null && varFaturamento < -LIMIAR_VARIACAO_PCT) {
    return { tipo: "queda_faturamento", texto: `Seu faturamento caiu ${formatarPct(varFaturamento)}% em relação ao mês anterior.` };
  }

  return { tipo: "estavel", texto: "Seu faturamento ficou estável em relação ao mês anterior." };
}
