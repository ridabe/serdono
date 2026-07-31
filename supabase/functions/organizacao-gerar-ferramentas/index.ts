// Ser Dono — Edge Function "organizacao-gerar-ferramentas" (Jornada
// Empreendedora, Fase Organização do Negócio, SDD-48).
//
// A IA gera um roteiro de 4 a 6 CATEGORIAS de ferramenta de gestão
// relevantes pro nicho e nível de maturidade do usuário (ex.: planilha,
// agenda digital, sistema financeiro, emissão fiscal) — nunca o nome de um
// produto/marca específico, mesma honestidade já aplicada no roteiro de
// fornecedores (SDD-41): a IA não tem como saber qual ferramenta é
// realmente boa hoje, então recomendar uma marca seria inventar autoridade
// que não existe.
//
// Modelo econômico (RN-10): geração curta e estruturada, mesmo porte do
// roteiro de fornecedores.

import { createClient } from "npm:@supabase/supabase-js@2";

const AI_MODEL_ECONOMICO = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

interface CategoriaFerramenta {
  nome: string;
  para_que_serve: string;
  quando_faz_sentido: string;
  nivel: "basico" | "intermediario" | "avancado";
}

async function gerarCategorias(nicho: string, nivelMaturidade: number): Promise<CategoriaFerramenta[]> {
  const system = [
    "Você é o copiloto do Ser Dono. Gere de 4 a 6 CATEGORIAS de ferramenta de gestão (nunca nome de produto ou marca",
    "específica — ex.: 'planilha de fluxo de caixa', 'sistema de emissão fiscal', 'agenda digital compartilhada',",
    "nunca 'Google Sheets' ou 'Trello') mais úteis pro tipo de negócio e nível de maturidade organizacional",
    "informados. Para cada categoria, dê: pra que serve, quando faz sentido adotar (ex.: 'a partir de X vendas por",
    'mês\'), e o nível ("basico", "intermediario" ou "avancado", condizente com o nível de maturidade do negócio hoje',
    "— priorize categorias de nível básico/intermediário pra negócios com maturidade baixa, nunca recomende",
    'ferramenta avançada/cara demais pro estágio atual). Responda EXCLUSIVAMENTE com um objeto JSON no formato',
    '{"categorias":[{"nome":"...","para_que_serve":"...","quando_faz_sentido":"...","nivel":"basico|intermediario|avancado"}]},',
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
      messages: [{ role: "user", content: `Nicho: ${nicho}\nNível de maturidade organizacional atual (1 a 4): ${nivelMaturidade}` }],
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
  const parsed = JSON.parse(cleaned) as { categorias: CategoriaFerramenta[] };
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

    const { jornada_instance_id, nivel_maturidade } = (await req.json()) as {
      jornada_instance_id?: string;
      nivel_maturidade?: number;
    };
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

    const nicho = (instance.niches as { nome?: string } | null)?.nome ?? "negócio";
    const categorias = await gerarCategorias(nicho, nivel_maturidade ?? 1);

    const { data: existente } = await supabase
      .from("jornada_deliverables")
      .select("versao")
      .eq("jornada_instance_id", jornada_instance_id)
      .eq("tipo", "organizacao_ferramentas")
      .maybeSingle();

    const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
      {
        jornada_instance_id,
        tipo: "organizacao_ferramentas",
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
