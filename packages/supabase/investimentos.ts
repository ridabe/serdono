import { supabase } from "./client";

/**
 * Módulo Mentoria em Investimentos (PRD §12.6, SPEC.md SDD-56/SDD-57).
 *
 * Não há CRUD aqui: o módulo não guarda carteira, aplicação nem recomendação
 * do usuário — guardar isso seria o primeiro passo pra virar o que o produto
 * não é (RN-33). A única chamada é a leitura de cotação, e ela passa por Edge
 * Function porque a chave da HG Brasil é segredo e o bundle do app é público.
 */

export type UnidadeIndicador = "brl" | "cambio" | "pontos" | "pct";

export interface IndicadorMercado {
  chave: string;
  nome: string;
  valor: number;
  /** Variação do dia em %, quando o indicador tem uma. Taxas (CDI/Selic) não têm. */
  variacaoPct: number | null;
  unidade: UnidadeIndicador;
}

export interface PontoSerie {
  capturadoEm: string;
  indicadores: IndicadorMercado[];
}

export interface Cotacoes {
  taxas: { cdiAnualPct: number; selicAnualPct: number };
  indicadores: IndicadorMercado[];
  /** Quando este dado foi lido da fonte — exibido na tela (RN-20). */
  capturadoEm: string;
  /** `true` quando veio do cache de 15 min, não de uma chamada nova à HG. */
  deCache: boolean;
  fonte: string;
  /**
   * Série que o produto acumulou desde que o módulo entrou no ar. O plano
   * atual da HG não dá histórico, então isto começa curto e cresce — a tela
   * é explícita sobre isso em vez de simular uma curva.
   */
  serie: PontoSerie[];
}

export async function getCotacoes(): Promise<Cotacoes> {
  const { data, error } = await supabase.functions.invoke("cotacoes", { body: {} });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as Cotacoes;
}
