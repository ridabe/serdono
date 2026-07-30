// Ser Dono — Edge Function "jornada-gerar-fornecedores" (Jornada
// Empreendedora, Fase 8: Fornecedores, SDD-41).
//
// A IA gera um roteiro de busca: 4 a 6 CATEGORIAS de fornecedor/parceiro
// relevantes pro nicho do usuário, cada uma com explicação de por que
// importa, o que avaliar ao escolher, e uma busca pronta no Google.
//
// Nunca gera nome de empresa específica — isso viraria dado inventado (a
// IA não tem acesso a fornecedor real nenhum). Fornecedor de verdade vem da
// base de parceiros curada pelo admin (fornecedores_parceiros, filtrada por
// nicho no client) ou da própria pesquisa do usuário, nunca da IA.
//
// Modelo econômico (RN-10): é geração de lista curta e estruturada, mesmo
// porte da geração de slogan em jornada-gerar-identidade.

import { createClient } from "npm:@supabase/supabase-js@2";

const AI_MODEL_ECONOMICO = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

interface CategoriaIA {
  nome: string;
  explicacao: string;
  o_que_avaliar: string;
  busca_sugerida: string;
}

interface RoteiroCategoria extends CategoriaIA {
  busca_google_url: string;
}

async function gerarCategorias(nomeEmpresa: string, nicho: string): Promise<CategoriaIA[]> {
  const system = [
    "Você é o copiloto do Ser Dono. Gere de 4 a 6 CATEGORIAS de fornecedor ou parceiro que um negócio desse",
    "tipo normalmente precisa (ex.: matéria-prima, embalagem, equipamento, uniforme, serviço terceirizado) —",
    "NUNCA o nome de uma empresa fornecedora específica, você não tem acesso a fornecedor real nenhum e",
    "inventar um nome seria enganar o usuário. Para cada categoria, dê: uma explicação curta de por que esse",
    "negócio precisa disso, um critério prático de como avaliar/comparar fornecedores dessa categoria, e uma",
    'busca pronta pra colar no Google (com o tipo de negócio e a categoria, sem cidade). Responda EXCLUSIVAMENTE',
    'com um objeto JSON no formato {"categorias":[{"nome":"...","explicacao":"...","o_que_avaliar":"...","busca_sugerida":"..."}]},',
    "sem markdown, sem texto antes ou depois.",
  ].join(" ");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL_ECONOMICO,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: `Nome da empresa: ${nomeEmpresa}\nNicho: ${nicho}` }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  const parsed = JSON.parse(cleaned) as { categorias: CategoriaIA[] };
  return parsed.categorias;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Faltando header Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { jornada_instance_id } = (await req.json()) as { jornada_instance_id?: string };
    if (!jornada_instance_id) {
      return new Response(JSON.stringify({ error: "Campo 'jornada_instance_id' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("id", jornada_instance_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance) {
      return new Response(JSON.stringify({ error: "Jornada não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const nomeEmpresa = instance.nome_empresa_escolhido ?? "meu negócio";
    const nicho = (instance.niches as { nome?: string } | null)?.nome ?? "negócio";

    const categoriasIA = await gerarCategorias(nomeEmpresa, nicho);
    const categorias: RoteiroCategoria[] = categoriasIA.map((c) => ({
      ...c,
      busca_google_url: `https://www.google.com/search?q=${encodeURIComponent(c.busca_sugerida)}`,
    }));

    const { data: existente } = await supabase
      .from("jornada_deliverables")
      .select("versao")
      .eq("jornada_instance_id", jornada_instance_id)
      .eq("tipo", "fornecedores_roteiro")
      .maybeSingle();

    const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
      {
        jornada_instance_id,
        tipo: "fornecedores_roteiro",
        conteudo: { categorias },
        gerado_por: "ia",
        versao: (existente?.versao ?? 0) + 1,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "jornada_instance_id,tipo" }
    );
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ categorias }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
