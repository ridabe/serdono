/**
 * Check-up Mensal do Negócio (pedido do dono do produto, 08/08/2026,
 * citado como prioridade nº 1) — lógica pura (SDD-3). Catálogo fixo de
 * perguntas em código, não CRUD de admin — mesmo raciocínio já usado no
 * diagnóstico e no conteúdo curado de Meu Negócio em Dia (SDD-61): é
 * estrutura do produto, não conteúdo editorial que muda por curadoria.
 */

export type SecaoCheckup = "financeiro" | "clientes" | "marketing" | "operacao";

export const SECOES_CHECKUP: { chave: SecaoCheckup; titulo: string }[] = [
  { chave: "financeiro", titulo: "Financeiro" },
  { chave: "clientes", titulo: "Clientes" },
  { chave: "marketing", titulo: "Marketing" },
  { chave: "operacao", titulo: "Operação" },
];

export type TipoPerguntaCheckup = "sim_nao" | "selecao" | "texto";

export interface OpcaoPergunta {
  valor: string;
  label: string;
}

export interface PerguntaCheckup {
  slug: string;
  secao: SecaoCheckup;
  texto: string;
  tipo: TipoPerguntaCheckup;
  opcoes?: OpcaoPergunta[];
  /** Só aparece se a pergunta de slug `dependeDe` tiver sido respondida com `valorParaMostrar`. */
  condicional?: { dependeDe: string; valorParaMostrar: unknown };
}

const FAIXAS_FATURAMENTO: OpcaoPergunta[] = [
  { valor: "nao_faturei", label: "Não faturei nada" },
  { valor: "ate_1000", label: "Até R$ 1.000" },
  { valor: "de_1000_a_3000", label: "R$ 1.000 a R$ 3.000" },
  { valor: "de_3000_a_10000", label: "R$ 3.000 a R$ 10.000" },
  { valor: "acima_10000", label: "Acima de R$ 10.000" },
];

const TENDENCIA: OpcaoPergunta[] = [
  { valor: "aumentaram", label: "Aumentaram" },
  { valor: "diminuiram", label: "Diminuíram" },
  { valor: "mantiveram", label: "Ficaram estáveis" },
];

const CANAIS_MARKETING: OpcaoPergunta[] = [
  { valor: "instagram", label: "Instagram" },
  { valor: "whatsapp", label: "WhatsApp" },
  { valor: "indicacao", label: "Indicação" },
  { valor: "google", label: "Google" },
  { valor: "outro", label: "Outro" },
  { valor: "nenhum", label: "Nenhum trouxe resultado" },
];

/** As ~16 perguntas fechadas do check-up ("menos de 5 minutos") + 2 campos de texto opcionais condicionais. */
export const PERGUNTAS_CHECKUP: PerguntaCheckup[] = [
  { slug: "faturamento_faixa", secao: "financeiro", texto: "Quanto aproximadamente você faturou este mês?", tipo: "selecao", opcoes: FAIXAS_FATURAMENTO },
  { slug: "vendas_tendencia", secao: "financeiro", texto: "Suas vendas aumentaram ou diminuíram?", tipo: "selecao", opcoes: TENDENCIA },
  { slug: "despesas_tendencia", secao: "financeiro", texto: "Suas despesas aumentaram, diminuíram ou ficaram estáveis?", tipo: "selecao", opcoes: TENDENCIA },
  { slug: "sobrou_caixa", secao: "financeiro", texto: "Sobrou dinheiro no caixa no fim do mês?", tipo: "sim_nao" },
  { slug: "despesa_inesperada", secao: "financeiro", texto: "Teve alguma despesa inesperada?", tipo: "sim_nao" },
  { slug: "despesa_inesperada_detalhe", secao: "financeiro", texto: "Qual foi?", tipo: "texto", condicional: { dependeDe: "despesa_inesperada", valorParaMostrar: true } },

  { slug: "novos_clientes", secao: "clientes", texto: "Conquistou clientes novos este mês?", tipo: "sim_nao" },
  { slug: "clientes_voltaram", secao: "clientes", texto: "Algum cliente antigo voltou a comprar?", tipo: "sim_nao" },
  { slug: "reclamacoes", secao: "clientes", texto: "Recebeu alguma reclamação?", tipo: "sim_nao" },
  { slug: "indicacoes", secao: "clientes", texto: "Recebeu indicações de clientes?", tipo: "sim_nao" },

  { slug: "fez_divulgacao", secao: "marketing", texto: "Fez alguma divulgação este mês?", tipo: "sim_nao" },
  { slug: "canal_mais_resultado", secao: "marketing", texto: "Qual canal trouxe mais resultado?", tipo: "selecao", opcoes: CANAIS_MARKETING },
  { slug: "fez_promocao", secao: "marketing", texto: "Fez alguma promoção ou desconto?", tipo: "sim_nao" },

  { slug: "problema_fornecedor", secao: "operacao", texto: "Teve problema com algum fornecedor?", tipo: "sim_nao" },
  { slug: "atraso_entrega", secao: "operacao", texto: "Atrasou alguma entrega pro cliente?", tipo: "sim_nao" },
  { slug: "faltou_produto", secao: "operacao", texto: "Faltou produto ou material?", tipo: "sim_nao" },
  { slug: "processo_demorado", secao: "operacao", texto: "Algum processo do dia a dia está tomando tempo demais?", tipo: "sim_nao" },
  { slug: "processo_demorado_detalhe", secao: "operacao", texto: "Qual processo?", tipo: "texto", condicional: { dependeDe: "processo_demorado", valorParaMostrar: true } },
];

export function perguntasDaSecao(secao: SecaoCheckup): PerguntaCheckup[] {
  return PERGUNTAS_CHECKUP.filter((p) => p.secao === secao);
}

/** Uma pergunta condicional só conta como pendente/exibível se a dependência já tiver a resposta certa. */
export function perguntaVisivel(pergunta: PerguntaCheckup, respostas: Record<string, unknown>): boolean {
  if (!pergunta.condicional) return true;
  return respostas[pergunta.condicional.dependeDe] === pergunta.condicional.valorParaMostrar;
}

/**
 * RN nova (PRD): Check-up Mensal só libera com uma Jornada existente
 * (nicho confirmado) — sem isso não há negócio nenhum pra fazer raio-x. Bem
 * mais permissivo que o Plano de Ação Mensal (que exige Fase 2 concluída,
 * SDD-86/RN-39): aqui a pergunta é sobre o que ACONTECEU no negócio, não
 * sobre planejamento estratégico prévio.
 */
export function elegivelCheckupMensal(jornadaExiste: boolean): boolean {
  return jornadaExiste;
}

export type StatusSaude = "bom" | "atencao" | "precisa_melhorar";

export interface CategoriaSaude {
  status: StatusSaude;
  comentario: string;
}

export interface SaudeCheckup {
  financeiro: CategoriaSaude;
  clientes: CategoriaSaude;
  marketing: CategoriaSaude;
  operacao: CategoriaSaude;
  pontuacao_geral: number;
  prioridades: string[];
}
