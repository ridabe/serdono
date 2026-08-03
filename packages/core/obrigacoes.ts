/**
 * Meu Negócio em Dia — módulo do catálogo (PRD §12.8, SPEC.md SDD-61).
 *
 * Mesmo espírito de `retencao.ts`: funções puras, sem rede, recalculadas a
 * cada mudança. Este arquivo responde só a uma pergunta — "dada uma regra de
 * vencimento e a data de hoje, qual é o próximo prazo e ele está em cima da
 * hora?" — nunca se um valor foi de fato pago ou declarado (RN-35: o produto
 * não sabe disso, só sabe que uma data passou).
 */

export type RegimeEmpresa = "mei" | "simples" | "presumido_real";

export type RegraVencimento =
  | { tipo: "mensal_dia_fixo"; dia: number }
  | { tipo: "anual_dia_mes"; dia: number; mes: number }
  | { tipo: "trimestral_ultimo_dia_mes_seguinte" }
  | { tipo: "variavel" };

export interface ObrigacaoCatalogo {
  id: string;
  slug: string;
  regime: RegimeEmpresa[];
  requerFuncionarios: boolean;
  nome: string;
  descricao: string;
  comoFazer: string;
  regraVencimento: RegraVencimento;
  fonteUrl: string;
  fonteData: string;
  ordem: number;
}

export type StatusObrigacao = "concluido" | "sem_prazo_fixo" | "no_prazo" | "proximo" | "atrasado";

export interface ProximaOcorrencia {
  /** `YYYY-MM-DD`, ou `null` quando a regra é `variavel` (sem data fixa a contar). */
  dataVencimento: string | null;
  /** Identifica o período a que este prazo se refere — chave de `marcarConcluido`. */
  periodoReferencia: string;
}

/** Janela, em dias, a partir da qual um prazo ainda não vencido já é sinalizado como "próximo". */
const JANELA_PROXIMO_DIAS = 7;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function partesISO(iso: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

/** Último dia do mês (1-indexado) informado, respeitando ano bissexto. */
function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function diasEntre(deISO: string, ateISO: string): number {
  const de = new Date(`${deISO}T00:00:00Z`).getTime();
  const ate = new Date(`${ateISO}T00:00:00Z`).getTime();
  return Math.floor((ate - de) / 86_400_000);
}

/**
 * Próxima ocorrência de uma regra de vencimento a partir de hoje.
 *
 * `mensal_dia_fixo`: se o dia deste mês já passou, rola pro mesmo dia do mês
 * seguinte (o dia é limitado ao último dia do mês de destino, pra nunca gerar
 * "31 de fevereiro"). `anual_dia_mes`: mesma lógica, mas rolando pro ano
 * seguinte quando a data deste ano já passou. `trimestral_ultimo_dia_mes_
 * seguinte`: fecha o trimestre corrente (mar/jun/set/dez) e vence no último
 * dia do mês seguinte ao fechamento — se esse vencimento já passou, avança
 * pro trimestre seguinte. `variavel`: nunca tem data — o prazo depende de
 * órgão local (RN-36), então não existe contagem regressiva a mostrar.
 */
export function proximaOcorrencia(regra: RegraVencimento, hojeStr: string): ProximaOcorrencia {
  const { ano, mes, dia: diaHoje } = partesISO(hojeStr);

  if (regra.tipo === "variavel") {
    return { dataVencimento: null, periodoReferencia: "sempre" };
  }

  if (regra.tipo === "mensal_dia_fixo") {
    const diaEsteMes = Math.min(regra.dia, ultimoDiaDoMes(ano, mes));
    const venceEsteMes = `${ano}-${pad2(mes)}-${pad2(diaEsteMes)}`;
    if (diaHoje <= diaEsteMes) {
      return { dataVencimento: venceEsteMes, periodoReferencia: `${ano}-${pad2(mes)}` };
    }
    const proximoMes = mes === 12 ? 1 : mes + 1;
    const proximoAno = mes === 12 ? ano + 1 : ano;
    const diaProximoMes = Math.min(regra.dia, ultimoDiaDoMes(proximoAno, proximoMes));
    return {
      dataVencimento: `${proximoAno}-${pad2(proximoMes)}-${pad2(diaProximoMes)}`,
      periodoReferencia: `${proximoAno}-${pad2(proximoMes)}`,
    };
  }

  if (regra.tipo === "anual_dia_mes") {
    const venceEsteAno = `${ano}-${pad2(regra.mes)}-${pad2(regra.dia)}`;
    if (hojeStr <= venceEsteAno) {
      return { dataVencimento: venceEsteAno, periodoReferencia: `${ano}` };
    }
    return { dataVencimento: `${ano + 1}-${pad2(regra.mes)}-${pad2(regra.dia)}`, periodoReferencia: `${ano + 1}` };
  }

  // trimestral_ultimo_dia_mes_seguinte: trimestres fecham em mar/jun/set/dez;
  // vencimento é o último dia do mês seguinte ao fechamento.
  const fechamentosMes = [3, 6, 9, 12];
  for (const fechamento of fechamentosMes) {
    const mesVencimento = fechamento === 12 ? 1 : fechamento + 1;
    const anoVencimento = fechamento === 12 ? ano + 1 : ano;
    const diaVencimento = ultimoDiaDoMes(anoVencimento, mesVencimento);
    const dataVencimento = `${anoVencimento}-${pad2(mesVencimento)}-${pad2(diaVencimento)}`;
    if (hojeStr <= dataVencimento) {
      const trimestre = Math.ceil(fechamento / 3);
      return { dataVencimento, periodoReferencia: `${ano}-Q${trimestre}` };
    }
  }
  // Nenhum fechamento deste ano ainda vence (não deveria acontecer, pois
  // dezembro sempre cobre o resto do ano) — cai pro primeiro trimestre do
  // ano seguinte por segurança.
  const diaVencimento = ultimoDiaDoMes(ano + 1, 4);
  return { dataVencimento: `${ano + 1}-04-${pad2(diaVencimento)}`, periodoReferencia: `${ano + 1}-Q1` };
}

/**
 * Classifica o status de uma obrigação. `concluido` só existe quando o
 * empreendedor marcou aquele período de fato (RN-35) — nunca inferido pela
 * data. Sem data fixa (`variavel`), o status é sempre `sem_prazo_fixo`,
 * exceto se já concluído.
 */
export function classificarStatusObrigacao(
  dataVencimento: string | null,
  concluidoEm: string | null,
  hojeStr: string
): StatusObrigacao {
  if (concluidoEm) return "concluido";
  if (dataVencimento == null) return "sem_prazo_fixo";

  const dias = diasEntre(hojeStr, dataVencimento);
  if (dias < 0) return "atrasado";
  if (dias <= JANELA_PROXIMO_DIAS) return "proximo";
  return "no_prazo";
}

/** Filtra o catálogo curado pelas obrigações que se aplicam ao regime/config do empreendedor. */
export function filtrarObrigacoesAplicaveis(
  catalogo: ObrigacaoCatalogo[],
  regime: RegimeEmpresa,
  temFuncionarios: boolean
): ObrigacaoCatalogo[] {
  return catalogo
    .filter((o) => o.regime.includes(regime))
    .filter((o) => !o.requerFuncionarios || temFuncionarios)
    .sort((a, b) => a.ordem - b.ordem);
}

export interface ObrigacaoParaOrdenar {
  status: StatusObrigacao;
  dataVencimento: string | null;
}

const PESO_STATUS: Record<StatusObrigacao, number> = {
  atrasado: 0,
  proximo: 1,
  no_prazo: 2,
  sem_prazo_fixo: 3,
  concluido: 4,
};

/** Ordem de urgência: atrasado primeiro, concluído por último. Não muta o array recebido. */
export function ordenarPorUrgencia<T extends ObrigacaoParaOrdenar>(obrigacoes: T[]): T[] {
  return [...obrigacoes].sort((a, b) => {
    const peso = PESO_STATUS[a.status] - PESO_STATUS[b.status];
    if (peso !== 0) return peso;
    if (a.dataVencimento == null || b.dataVencimento == null) return 0;
    return a.dataVencimento < b.dataVencimento ? -1 : a.dataVencimento > b.dataVencimento ? 1 : 0;
  });
}

export const STATUS_LABEL: Record<StatusObrigacao, string> = {
  concluido: "Concluído",
  sem_prazo_fixo: "Sem prazo fixo",
  no_prazo: "No prazo",
  proximo: "Vence em breve",
  atrasado: "Prazo passou",
};

export const REGIME_LABEL: Record<RegimeEmpresa, string> = {
  mei: "MEI",
  simples: "ME/EPP — Simples Nacional",
  presumido_real: "Lucro Presumido ou Real",
};
