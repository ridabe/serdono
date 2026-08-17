/**
 * Cobrança via AbacatePay (pedido do dono do produto, 17/08/2026). 3 planos:
 * Gratuito, Essencial (R$ 19,90/mês no lançamento, R$ 29,90 depois) e Master
 * (R$ 39,90/mês no lançamento, R$ 59,90 depois) — preços vêm do documento
 * "Planos, Custos e Ponto de Equilíbrio" (13/08/2026).
 *
 * V1 cobra direto o preço de lançamento — a migração automática pro preço
 * cheio depois de 6 meses por assinante fica fora desta versão (decisão de
 * negócio a reabrir depois, não é limitação técnica).
 */

export type Plano = "gratuito" | "essencial" | "master";

const ORDEM_PLANO: Record<Plano, number> = { gratuito: 0, essencial: 1, master: 2 };

export interface PlanoCatalogo {
  valor: Plano;
  nome: string;
  precoLancamentoCentavos: number;
  precoCheioCentavos: number;
  descricao: string;
  beneficios: string[];
}

export const PLANOS_CATALOGO: PlanoCatalogo[] = [
  {
    valor: "gratuito",
    nome: "Gratuito",
    precoLancamentoCentavos: 0,
    precoCheioCentavos: 0,
    descricao: "Descobrir qual negócio combina com você — e provar que a Mary entrega de verdade.",
    beneficios: [
      "Diagnóstico e escolha do nicho",
      "Jornada — Validação da Ideia",
      "Persona, SWOT, Canvas, Proposta de Valor",
      "Dicas da Mary",
      "Painel do Empreendedor",
    ],
  },
  {
    valor: "essencial",
    nome: "Essencial",
    precoLancamentoCentavos: 1990,
    precoCheioCentavos: 2990,
    descricao: "Sair do zero e abrir a empresa: nome, marca, CNPJ, preço, primeiros clientes.",
    beneficios: [
      "Tudo do Gratuito",
      "Jornada completa, 12 fases",
      "Nome da empresa e logo",
      "Calculadora de Precificação",
      "Meu Negócio em Dia",
      "Parceiros e Fornecedores",
      "A Mary responde",
    ],
  },
  {
    valor: "master",
    nome: "Master",
    precoLancamentoCentavos: 3990,
    precoCheioCentavos: 5990,
    descricao: "Tocar o negócio depois de aberto: acompanhar, decidir e crescer todo mês.",
    beneficios: [
      "Tudo do Essencial",
      "Check-up Mensal do Negócio",
      "Plano de Ação Mensal",
      "Raio-X Financeiro",
      "Nível de Maturidade e Ser Dono Score",
      "Retenção de Clientes",
      "Assistente de Reunião",
      "Assistente de Contrato",
      "Mentoria em Investimentos",
    ],
  },
];

export function labelPlano(plano: Plano): string {
  return PLANOS_CATALOGO.find((p) => p.valor === plano)?.nome ?? plano;
}

/** Compara ordinal: `planoAtual` precisa ser igual ou superior a `planoMinimo`. */
export function planoAtende(planoMinimo: Plano, planoAtual: Plano): boolean {
  return ORDEM_PLANO[planoAtual] >= ORDEM_PLANO[planoMinimo];
}

/**
 * Gate por FASE dentro da Jornada Empreendedora (não por módulo inteiro —
 * decisão fechada com o dono do produto, 17/08/2026): Gratuito só tem a fase
 * 1 (Validação da Ideia). Fase 2 (Planejamento, nome/logo) em diante exige
 * Essencial+.
 */
export const FASES_JORNADA_GRATUITAS: string[] = ["validacao_ideia"];

export function faseJornadaLiberada(fase: string, planoAtual: Plano): boolean {
  return FASES_JORNADA_GRATUITAS.includes(fase) || planoAtende("essencial", planoAtual);
}
