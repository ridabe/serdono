/**
 * Ordem das fases da Jornada Empreendedora e cálculo de progresso (SDD-50).
 *
 * Extraído de `JornadaScreen.tsx` quando o painel do empreendedor passou a
 * precisar do MESMO número de progresso (SDD-50): duas telas calculando "o
 * quanto o empreendedor já andou" cada uma do seu jeito é como um dizer 92%
 * e o outro 100% na mesma conta. Vive aqui, e não em `apps/app`, pela regra
 * de SDD-3 — lógica de negócio fora do app, testável isoladamente.
 *
 * O tipo de entrada é estrutural de propósito: `packages/core` não depende de
 * `packages/supabase` (só `apps/app` depende dos dois), então recebemos o
 * mínimo de cada etapa em vez do row do banco.
 */

export type JornadaFaseCore =
  | "validacao_ideia"
  | "planejamento"
  | "formalizacao"
  | "financeiro"
  | "estrutura"
  | "fornecedores"
  | "produto"
  | "marketing"
  | "clientes"
  | "primeira_venda"
  | "organizacao";

/**
 * Ordem reorganizada em 30/07/2026 (SDD-39 a SDD-42) e encerrada em
 * Organização em 31/07/2026 (SDD-49) — Retenção/Escala viraram módulos
 * independentes, não fases.
 */
export const FASES_JORNADA: JornadaFaseCore[] = [
  "validacao_ideia",
  "planejamento",
  "formalizacao",
  "financeiro",
  "estrutura",
  "fornecedores",
  "produto",
  "marketing",
  "clientes",
  "primeira_venda",
  "organizacao",
];

export const FASE_JORNADA_LABEL: Record<JornadaFaseCore, string> = {
  validacao_ideia: "Validação da Ideia",
  planejamento: "Planejamento",
  formalizacao: "Formalização",
  financeiro: "Financeiro",
  estrutura: "Estrutura",
  fornecedores: "Fornecedores",
  produto: "Produto",
  marketing: "Marketing",
  clientes: "Clientes",
  primeira_venda: "Primeira Venda",
  organizacao: "Organização",
};

/**
 * Descoberta (diagnóstico + escolha do nicho) acontece antes do login e não
 * tem `jornada_etapas` própria (SDD-31) — entra como 1 fase sempre concluída
 * no numerador e no denominador.
 */
export const DESCOBERTA_STEPS = ["Diagnóstico de perfil", "Escolha do nicho"];

/** Só o que o cálculo precisa saber de uma etapa — ver nota de tipo estrutural acima. */
export interface EtapaParaProgresso {
  fase: string;
  concluida: boolean;
}

export interface ProgressoJornada {
  /** 0 a 100, inteiro. 100 sempre que a jornada está concluída. */
  percentual: number;
  concluida: boolean;
  /** A fase que vale pra trilha/cálculo: `organizacao` quando já concluída (o estado terminal não é uma fase). */
  faseEfetiva: JornadaFaseCore;
}

/**
 * Mesma conta de sempre: fases inteiras já passadas + a fração da fase atual,
 * sobre Descoberta + as fases de `FASES_JORNADA`. Fase sem etapa semeada
 * conta 0 de fração própria, sem fabricar um total inflado.
 */
export function calcularProgressoJornada(faseAtual: string, etapas: EtapaParaProgresso[]): ProgressoJornada {
  const concluida = faseAtual === "concluida";
  if (concluida) return { percentual: 100, concluida: true, faseEfetiva: "organizacao" };

  const faseEfetiva = (FASES_JORNADA.includes(faseAtual as JornadaFaseCore) ? faseAtual : FASES_JORNADA[0]) as JornadaFaseCore;
  const totalFases = FASES_JORNADA.length + 1;
  const fasesAntes = 1 + FASES_JORNADA.indexOf(faseEfetiva);

  const daFase = etapas.filter((e) => e.fase === faseEfetiva);
  const fracao = daFase.length > 0 ? daFase.filter((e) => e.concluida).length / daFase.length : 0;

  return {
    percentual: Math.round(((fasesAntes + fracao) / totalFases) * 100),
    concluida: false,
    faseEfetiva,
  };
}
