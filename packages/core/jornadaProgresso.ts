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

/**
 * Número de exibição de uma fase ("Fase N") — Descoberta é a 1, implícita
 * (não entra em `FASES_JORNADA`), daí o `+ 2`.
 *
 * Existe pra nunca mais hardcodar "Fase 5 — Formalização" direto no texto de
 * uma tela (SDD-39 reordenou Financeiro pra logo depois de Formalização e
 * empurrou os números de Estrutura em diante — os textos hardcoded em cada
 * `*Screen.tsx` NUNCA foram atualizados junto, causando uma inconsistência
 * real de produção: o Início mostrava "Etapa 4: Formalização" (calculado)
 * enquanto `FormalizacaoScreen.tsx` mostrava "Fase 5 — Formalização"
 * hardcoded — achado e corrigido em 08/08/2026, ver SPEC.md SDD-82). Toda
 * tela de fase deve chamar esta função, nunca escrever o número à mão.
 */
export function numeroFase(fase: JornadaFaseCore): number {
  return FASES_JORNADA.indexOf(fase) + 2;
}

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
 * Soma a fração de conclusão de CADA fase (Descoberta sempre 1.0 + a fração
 * real de cada fase de `FASES_JORNADA`), não mais "fases antes = 1.0 por
 * suposição". Generalizado na SDD-52 pro fluxo de negócio existente, onde
 * lacunas são permitidas (uma fase depois de `fase_atual` pode já estar
 * concluída enquanto uma anterior ainda não está) — mas o resultado é
 * idêntico ao formato antigo no caso linear comum, com uma correção honesta:
 * fases "nada trava" (Estrutura, Formalização...) que o usuário atravessou
 * sem terminar todos os itens agora contam a fração real, não 100% por
 * suposição — mais fiel ao princípio de nunca inflar progresso (PRD §4).
 * Fase sem etapa semeada conta 0 de fração própria, sem fabricar um total
 * inflado.
 */
export function calcularProgressoJornada(faseAtual: string, etapas: EtapaParaProgresso[]): ProgressoJornada {
  const concluida = faseAtual === "concluida";
  if (concluida) return { percentual: 100, concluida: true, faseEfetiva: "organizacao" };

  const faseEfetiva = (FASES_JORNADA.includes(faseAtual as JornadaFaseCore) ? faseAtual : FASES_JORNADA[0]) as JornadaFaseCore;
  const totalFases = FASES_JORNADA.length + 1; // +1 = Descoberta, sempre concluída (SDD-31)

  const somaFracoes = FASES_JORNADA.reduce((soma, fase) => {
    const daFase = etapas.filter((e) => e.fase === fase);
    const fracao = daFase.length > 0 ? daFase.filter((e) => e.concluida).length / daFase.length : 0;
    return soma + fracao;
  }, 0);

  return {
    percentual: Math.round(((1 + somaFracoes) / totalFases) * 100),
    concluida: false,
    faseEfetiva,
  };
}

/** Uma fase e o quanto dela já está concluído, na ordem canônica de `FASES_JORNADA` — entrada de `proximaFasePendente`. */
export interface FaseComEtapas {
  fase: JornadaFaseCore;
  /** `false` = fase ainda não semeada (nenhuma `jornada_etapas` criada) — sempre pendente, mesmo sem saber a fração. */
  semeada: boolean;
  /** Uma entrada por etapa RELEVANTE da fase (já filtrada por regime/relevância de nicho pelo chamador) — vazio = nada exigido, fase trivialmente completa se já semeada. */
  concluidas: boolean[];
}

/**
 * Motor de avanço não-linear (SDD-52, fluxo de negócio existente): a próxima
 * fase é a primeira, na ordem canônica, que ainda não está 100% concluída —
 * nunca assume que "tudo antes de X" está pronto só porque `fase_atual`
 * avançou. Isso é o que permite lacuna (ex.: Formalização concluída, mas
 * Estrutura, que vem antes na ordem, ainda pendente): o motor não pula
 * Estrutura, mas também não trava Formalização de ter sido marcada primeiro
 * pelo questionário de intake.
 *
 * Função pura — quem chama monta a lista já filtrada (etapas relevantes por
 * nicho/regime) e na ordem certa; ver `avancarParaProximaFasePendente` em
 * `packages/supabase/jornada.ts` pra versão que busca do banco.
 */
export function proximaFasePendente(fases: FaseComEtapas[]): JornadaFaseCore | "concluida" {
  for (const f of fases) {
    if (!f.semeada) return f.fase;
    if (f.concluidas.some((c) => !c)) return f.fase;
  }
  return "concluida";
}
