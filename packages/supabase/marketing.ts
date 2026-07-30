import { supabase } from "./client";

/**
 * Fase 10 — Marketing (SDD-43). Bio + posts + anúncios são ENTREGÁVEL final
 * (`jornada_deliverables`, tipo `marketing_conteudo`), não uma etapa — o
 * empreendedor pode gerar de novo sempre que voltar aqui, mesmo padrão do
 * roteiro de fornecedores (SDD-41).
 */

export interface MarketingPost {
  titulo: string;
  legenda: string;
}

export interface MarketingAnuncio {
  titulo: string;
  corpo: string;
  cta: string;
}

export interface MarketingConteudo {
  bio: string;
  posts: MarketingPost[];
  anuncios: MarketingAnuncio[];
}

export async function generateMarketingConteudo(instanceId: string): Promise<MarketingConteudo> {
  const { data, error } = await supabase.functions.invoke("jornada-gerar-marketing", {
    body: { jornada_instance_id: instanceId },
  });
  if (error) throw error;
  return data as MarketingConteudo;
}

export async function getMarketingConteudo(instanceId: string): Promise<MarketingConteudo | null> {
  const { data, error } = await supabase
    .from("jornada_deliverables")
    .select("conteudo")
    .eq("jornada_instance_id", instanceId)
    .eq("tipo", "marketing_conteudo")
    .maybeSingle();
  if (error) throw error;
  return (data?.conteudo as unknown as MarketingConteudo | undefined) ?? null;
}
