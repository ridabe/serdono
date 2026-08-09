/**
 * Plano de Ação Mensal — lógica pura (SDD-3): elegibilidade, cálculo de
 * progresso e formatação de mês de referência. Nada aqui toca rede/banco —
 * a Edge Function `plano-acao-gerar` e o hook `usePlanoAcao` chamam estas
 * funções com o dado já carregado.
 */

import type { JornadaFaseCore } from "./jornadaProgresso";

/**
 * RN nova (PRD §12.9): o módulo só libera depois que a Jornada passar da
 * Fase 2 (Validação da Ideia) — antes disso não existe contexto de negócio
 * real o suficiente pra um plano de ação fazer sentido (nem persona, nem
 * SWOT, nem nenhuma etapa preenchida). `faseAtual` aceita `"concluida"`
 * (estado terminal fora de `FASES_JORNADA`) como sempre elegível.
 */
export function elegivelPlanoAcao(jornadaExiste: boolean, faseAtual: JornadaFaseCore | "concluida" | null): boolean {
  return jornadaExiste && faseAtual != null && faseAtual !== "validacao_ideia";
}

export interface PlanoAcaoItemCore {
  id: string;
  semana: number;
  ordem: number;
  titulo: string;
  concluido: boolean;
}

export interface ProgressoPlanoAcao {
  concluidos: number;
  total: number;
  /** 0 a 100, inteiro. 0 quando `total === 0` (nunca divide por zero). */
  percentual: number;
}

export function calcularProgressoPlanoAcao(itens: PlanoAcaoItemCore[]): ProgressoPlanoAcao {
  const total = itens.length;
  const concluidos = itens.filter((i) => i.concluido).length;
  return { concluidos, total, percentual: total > 0 ? Math.round((concluidos / total) * 100) : 0 };
}

/** Itens agrupados por semana (1 a 4), cada grupo já ordenado por `ordem`. Semana sem item nenhum vira array vazio. */
export function agruparItensPorSemana(itens: PlanoAcaoItemCore[]): Record<number, PlanoAcaoItemCore[]> {
  const grupos: Record<number, PlanoAcaoItemCore[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const item of itens) {
    (grupos[item.semana] ??= []).push(item);
  }
  for (const semana of Object.keys(grupos)) {
    grupos[Number(semana)].sort((a, b) => a.ordem - b.ordem);
  }
  return grupos;
}

const MESES_PT_BR = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * `mesReferenciaISO` no formato `YYYY-MM-DD` (sempre dia 1º) → "Agosto de
 * 2026". Parse manual dos componentes (não `new Date(iso)`) porque
 * `new Date("2026-08-01")` é meia-noite UTC e vira 31/07 em fusos negativos
 * — mesma armadilha já evitada em `formatarData` de outras telas.
 */
export function formatarMesReferencia(mesReferenciaISO: string): string {
  const [ano, mes] = mesReferenciaISO.split("-").map(Number);
  return `${MESES_PT_BR[mes - 1]} de ${ano}`;
}

/** Dia 1º do mês corrente, no formato `YYYY-MM-DD` — mesma convenção usada pra gravar `mes_referencia`. */
export function primeiroDiaMesAtualISO(agora: Date = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

/**
 * Em qual das 4 semanas do plano o dia do mês cai — usado pro resumo da
 * Início destacar a semana corrente sem precisar de mais nenhum dado.
 * Bucket fixo (1-7/8-14/15-21/22-31), não semana civil real — o plano em si
 * já nasce dividido em exatamente 4 blocos (SDD-86), não em quantas semanas
 * o mês tiver de verdade.
 */
export function semanaAtualDoMes(diaDoMes: number): number {
  if (diaDoMes <= 7) return 1;
  if (diaDoMes <= 14) return 2;
  if (diaDoMes <= 21) return 3;
  return 4;
}
