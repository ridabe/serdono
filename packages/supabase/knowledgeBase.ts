import { supabase } from "./client";

export type KnowledgeCategory = "empreendedorismo" | "financas" | "investimentos";

export interface KnowledgeSource {
  titulo: string;
  fonte: string;
  fonte_data: string;
  similarity: number;
  category: string;
}

export interface KnowledgeAnswer {
  answer: string;
  sources: KnowledgeSource[];
}

/**
 * RAG de conhecimento geral (MEI, finanças, investimentos) — SPEC.md §14 (RAG).
 * Serviço disponível a qualquer usuário autenticado (sessão anônima inclusive),
 * chamável de qualquer módulo do produto que precise responder uma dúvida do
 * empreendedor com uma fonte oficial por trás, não uma resposta genérica de IA.
 */
export async function askKnowledgeBase(question: string, category?: KnowledgeCategory): Promise<KnowledgeAnswer> {
  const { data, error } = await supabase.functions.invoke("knowledge-search", {
    body: { question, category },
  });
  if (error) throw error;
  return data as KnowledgeAnswer;
}
