/**
 * Assistente de Reunião (pedido do dono do produto, 12/08/2026) — lógica
 * pura (SDD-3). V1: só o formulário → guia gerado por IA → export em PDF.
 * Agenda, convite por e-mail, lembrete automático e histórico com resultado
 * ficam para uma V2 futura (fora de escopo aqui).
 *
 * Diferente de todo módulo mensal anterior (Check-up, Plano de Ação,
 * Raio-X, Nível de Maturidade): não há limite de "1 por mês" — o usuário
 * pode se preparar pra quantas reuniões precisar, a qualquer momento. Cada
 * geração é um registro novo, não um snapshot que se sobrescreve.
 */

export type TipoReuniao = "fornecedor" | "cliente_prospect" | "investidor" | "parceiro" | "banco_credito" | "outro";

export const TIPOS_REUNIAO: { valor: TipoReuniao; label: string }[] = [
  { valor: "fornecedor", label: "Fornecedor" },
  { valor: "cliente_prospect", label: "Cliente ou prospect" },
  { valor: "investidor", label: "Investidor" },
  { valor: "parceiro", label: "Parceiro de negócio" },
  { valor: "banco_credito", label: "Banco / crédito" },
  { valor: "outro", label: "Outro" },
];

export interface GuiaReuniao {
  resumo: string;
  pauta: string[];
  perguntas_a_fazer: string[];
  dicas_comportamento: string[];
  erros_a_evitar: string[];
  checklist_preparacao: string[];
}

/** Mesma regra "leve" do Check-up Mensal/Raio-X Financeiro: só precisa ter uma Jornada em andamento. */
export function elegivelAssistenteReuniao(jornadaExiste: boolean): boolean {
  return jornadaExiste;
}

/** `tipo_outro_detalhe` só é obrigatório quando `tipo === "outro"` — mesmo padrão condicional de `processo_demorado_detalhe` no Check-up. */
export function detalheObrigatorio(tipo: TipoReuniao): boolean {
  return tipo === "outro";
}
