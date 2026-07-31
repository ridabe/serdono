import { supabase } from "./client";

/**
 * Fase Organização do Negócio (SDD-48, MVP). Guia de gestão pra depois da
 * primeira venda — sem virar ERP: nenhuma tabela de operação real (contas a
 * pagar/receber, estoque, pedidos), tudo é conteúdo educativo + modelo pra
 * baixar. Só duas partes têm dado próprio: o roteiro de ferramentas (IA,
 * mesmo padrão do roteiro de fornecedores) e o catálogo fixo de indicadores.
 */

// ---- Roteiro de categorias de ferramenta de gestão (IA) ----

export interface CategoriaFerramenta {
  nome: string;
  para_que_serve: string;
  quando_faz_sentido: string;
  nivel: "basico" | "intermediario" | "avancado";
}

export async function generateRoteiroFerramentas(instanceId: string, nivelMaturidade: number): Promise<CategoriaFerramenta[]> {
  const { data, error } = await supabase.functions.invoke("organizacao-gerar-ferramentas", {
    body: { jornada_instance_id: instanceId, nivel_maturidade: nivelMaturidade },
  });
  if (error) throw error;
  return (data as { categorias: CategoriaFerramenta[] }).categorias;
}

export async function getRoteiroFerramentas(instanceId: string): Promise<CategoriaFerramenta[] | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "organizacao_ferramentas")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as { categorias: CategoriaFerramenta[] } | undefined)?.categorias ?? null;
}

// ---- Catálogo fixo de indicadores (PRD §9.12) ----

export type CategoriaIndicador = "financeiro" | "comercial" | "operacional" | "clientes";

export interface Indicador {
  id: string;
  texto: string;
  categoria: CategoriaIndicador;
}

/** Lista fixa, não gerada por IA — o objetivo é evitar sobrecarregar o empreendedor com dezenas de métricas (PRD §9.12). */
export const CATALOGO_INDICADORES: Indicador[] = [
  { id: "faturamento", texto: "Faturamento do mês", categoria: "financeiro" },
  { id: "despesas", texto: "Despesas do mês", categoria: "financeiro" },
  { id: "lucro_estimado", texto: "Lucro estimado", categoria: "financeiro" },
  { id: "saldo_caixa", texto: "Saldo de caixa", categoria: "financeiro" },
  { id: "contas_pagar", texto: "Contas a pagar em aberto", categoria: "financeiro" },
  { id: "contas_receber", texto: "Contas a receber em aberto", categoria: "financeiro" },
  { id: "ticket_medio", texto: "Ticket médio", categoria: "financeiro" },
  { id: "vendas", texto: "Número de vendas", categoria: "comercial" },
  { id: "pedidos", texto: "Número de pedidos", categoria: "comercial" },
  { id: "orcamentos", texto: "Orçamentos enviados", categoria: "comercial" },
  { id: "taxa_conversao", texto: "Taxa de conversão", categoria: "comercial" },
  { id: "produto_mais_vendido", texto: "Produto ou serviço mais vendido", categoria: "comercial" },
  { id: "pedidos_atrasados", texto: "Pedidos atrasados", categoria: "operacional" },
  { id: "tempo_entrega", texto: "Tempo médio de entrega", categoria: "operacional" },
  { id: "estoque_baixo", texto: "Itens com estoque baixo", categoria: "operacional" },
  { id: "clientes_atendidos", texto: "Clientes atendidos no mês", categoria: "clientes" },
  { id: "clientes_recorrentes", texto: "Clientes recorrentes", categoria: "clientes" },
  { id: "reclamacoes", texto: "Reclamações recebidas", categoria: "clientes" },
];

export const CATEGORIA_INDICADOR_LABEL: Record<CategoriaIndicador, string> = {
  financeiro: "Financeiros",
  comercial: "Comerciais",
  operacional: "Operacionais",
  clientes: "De clientes",
};
