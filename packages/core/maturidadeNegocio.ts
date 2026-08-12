/**
 * Nível de Maturidade do Negócio + Ser Dono Score — lógica pura (SDD-3).
 *
 * Conceito GLOBAL e separado do diagnóstico de maturidade organizacional
 * (1-4, `organizacaoMaturidade.ts`, PRD §9.12): aquele avalia só a etapa
 * Organização da Jornada; este é um retrato do negócio inteiro, alimentado
 * por vários módulos (Jornada, Check-up Mensal, Plano de Ação, Raio-X
 * Financeiro), pensado pra depois da Jornada concluída.
 *
 * As 5 sub-pontuações (0-100 cada) são julgadas por IA a partir de dado real
 * do usuário (mesmo padrão do Check-up Mensal) — a Edge Function
 * `maturidade-calcular` cuida disso. O que é determinístico e mora aqui é a
 * AGREGAÇÃO: o total nunca é "mais uma opinião da IA", é sempre a mesma
 * conta auditável a partir das 5 notas.
 */

export type CategoriaScore = "financeiro" | "marketing" | "clientes" | "organizacao" | "crescimento";

export const CATEGORIAS_SCORE: { chave: CategoriaScore; titulo: string }[] = [
  { chave: "financeiro", titulo: "Financeiro" },
  { chave: "marketing", titulo: "Marketing" },
  { chave: "clientes", titulo: "Clientes" },
  { chave: "organizacao", titulo: "Organização" },
  { chave: "crescimento", titulo: "Crescimento" },
];

export interface CategoriaResultado {
  /** 0 a 100. */
  pontuacao: number;
  comentario: string;
}

export type CategoriasResultado = Record<CategoriaScore, CategoriaResultado>;

export type NivelNegocio = "iniciante" | "em_operacao" | "em_crescimento" | "estruturado" | "preparado_escalar";

export const NIVEL_INFO: Record<NivelNegocio, { emoji: string; label: string; descricao: string }> = {
  iniciante: {
    emoji: "🌱",
    label: "Iniciante",
    descricao: "Seu negócio está começando — o foco agora é ganhar os primeiros controles e resultados.",
  },
  em_operacao: {
    emoji: "🚀",
    label: "Em operação",
    descricao: "O negócio já está rodando, com algumas rotinas básicas funcionando.",
  },
  em_crescimento: {
    emoji: "📈",
    label: "Em crescimento",
    descricao: "Os resultados estão aparecendo — o próximo passo é dar mais consistência ao que já funciona.",
  },
  estruturado: {
    emoji: "🏆",
    label: "Estruturado",
    descricao: "Seu negócio já tem processos e controles sólidos na maioria das áreas.",
  },
  preparado_escalar: {
    emoji: "💎",
    label: "Preparado para escalar",
    descricao: "Seu negócio está pronto pra crescer com mais volume, mantendo o controle.",
  },
};

/** Ordem canônica dos 5 estágios, do mais inicial ao mais avançado — usada pelo stepper da tela. */
export const NIVEIS_NEGOCIO: NivelNegocio[] = ["iniciante", "em_operacao", "em_crescimento", "estruturado", "preparado_escalar"];

/**
 * Score total = média das 5 categorias × 10, arredondado — nunca decidido
 * pela IA. Com 5 categorias 0-100, a média cai naturalmente em 0-100 e ×10
 * dá a escala 0-1000 pedida, sem pesos escondidos nem fórmula opaca.
 */
export function calcularPontuacaoTotal(categorias: Record<CategoriaScore, number>): number {
  const valores = CATEGORIAS_SCORE.map((c) => categorias[c.chave]);
  const media = valores.reduce((soma, v) => soma + v, 0) / valores.length;
  return Math.max(0, Math.min(1000, Math.round(media * 10)));
}

/** Faixas de 200 pontos, das 5 no total (0-1000) — mesmo espírito de `nivelDaPontuacao` de `organizacaoMaturidade.ts`. */
export function nivelDaPontuacao(pontuacaoTotal: number): NivelNegocio {
  if (pontuacaoTotal < 200) return "iniciante";
  if (pontuacaoTotal < 400) return "em_operacao";
  if (pontuacaoTotal < 600) return "em_crescimento";
  if (pontuacaoTotal < 800) return "estruturado";
  return "preparado_escalar";
}

/** Mesma regra do Check-up Mensal/Raio-X Financeiro: precisa ter uma Jornada em andamento pra existir negócio pra avaliar. */
export function elegivelMaturidadeNegocio(jornadaExiste: boolean): boolean {
  return jornadaExiste;
}
