/**
 * Assistente de Reunião (pedido do dono do produto, 12/08/2026) — lógica
 * pura (SDD-3). V1: formulário → guia gerado por IA → export em PDF.
 * V2 (fatia 1, 12/08/2026): agendar a reunião (data/hora/local/contato) a
 * partir de um guia já gerado. Convite por e-mail, lembrete automático e
 * histórico com resultado continuam fora de escopo.
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

// ---- Agenda (V2, fatia 1) ----

export type LocalTipoReuniao = "presencial" | "online";

export const LOCAL_TIPO_LABEL: Record<LocalTipoReuniao, { tipoLabel: string; campoLabel: string; placeholder: string }> = {
  presencial: { tipoLabel: "Presencial", campoLabel: "Endereço", placeholder: "Ex.: Av. Paulista, 1000 - sala 12" },
  online: { tipoLabel: "Online", campoLabel: "Link da chamada", placeholder: "Ex.: https://meet.google.com/..." },
};

export interface AgendamentoReuniao {
  dataHoraISO: string;
  localTipo: LocalTipoReuniao;
  localValor: string;
  contatoNome?: string;
}

/** Nunca deixa agendar reunião no passado — mesmo princípio de nunca fingir dado incoerente (RN-53). */
export function agendamentoValido(dataHoraISO: string, agora: Date = new Date()): boolean {
  const data = new Date(dataHoraISO);
  return !Number.isNaN(data.getTime()) && data.getTime() > agora.getTime();
}

/** "15/08/2026 às 14:00" — mesma convenção pt-BR de formatação de data já usada no app. */
export function formatarDataHoraReuniao(dataHoraISO: string): string {
  const data = new Date(dataHoraISO);
  const dataFormatada = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dataFormatada} às ${horaFormatada}`;
}
