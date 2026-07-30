// Ser Dono — Edge Function "jornada-gerar-identidade" (Jornada Empreendedora,
// Fase 3: Planejamento, Etapa 2 — Identidade Visual, SDD-35).
//
// A partir do questionário curto (valores, personalidade, tom de
// comunicação, cores) e do nome já escolhido (SDD-34), gera:
//  1) um slogan (modelo econômico — RN-10, é texto curto, baixa complexidade);
//  2) 3 rascunhos de logo em qualidade BAIXA (economia de custo — o usuário
//     só recebe a versão em alta qualidade depois de escolher, na function
//     jornada-gerar-logo-final).
//
// Diferente de jornada-gerar-documentos/jornada-gerar-nomes, os 3 prompts de
// logo são montados por TEMPLATE FIXO, sem nenhuma chamada de IA extra pra
// "criar o prompt" — minimiza tokens gastos por geração, conforme pedido.
//
// Mesmo padrão de auth das demais functions da Jornada: repassa o
// Authorization do chamador, sem service_role.

import { createClient } from "npm:@supabase/supabase-js@2";

const AI_MODEL_ECONOMICO = "claude-haiku-4-5-20251001";
const OPENAI_IMAGE_MODEL = "gpt-image-1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

type Estilo = "minimalista" | "moderno" | "classico";
const ESTILOS: Estilo[] = ["minimalista", "moderno", "classico"];

interface Respostas {
  valores: string[];
  personalidade: string[];
  tom_comunicacao: string;
  cores_preferidas: string[];
  cores_evitar: string[];
}

interface Contexto {
  nome_empresa: string;
  nicho: string;
  respostas: Respostas;
}

function montarPromptLogo(estilo: Estilo, ctx: Contexto): string {
  const { nome_empresa, nicho, respostas } = ctx;
  const base =
    `Logotipo profissional para a empresa "${nome_empresa}", um negócio de ${nicho}. ` +
    `Valores da marca: ${respostas.valores.join(", ")}. Personalidade: ${respostas.personalidade.join(", ")}. ` +
    `Tom de comunicação: ${respostas.tom_comunicacao}. Cores preferidas: ${respostas.cores_preferidas.join(", ")}. ` +
    (respostas.cores_evitar.length > 0 ? `Evitar as cores: ${respostas.cores_evitar.join(", ")}. ` : "") +
    "Fundo branco liso, logo centralizado, sem texto além do nome da empresa, alta legibilidade em tamanho pequeno.";

  const porEstilo: Record<Estilo, string> = {
    minimalista:
      "Estilo minimalista: formas geométricas simples, poucas cores, bastante espaço negativo, tipografia sans-serif limpa.",
    moderno:
      "Estilo moderno e ousado: formas dinâmicas, contraste forte, tipografia sans-serif com peso, sensação de energia e inovação.",
    classico:
      "Estilo clássico e elegante: composição simétrica, tipografia serifada refinada, sensação de tradição e confiança.",
  };

  return `${base} ${porEstilo[estilo]}`;
}

async function gerarSlogan(ctx: Contexto): Promise<string> {
  const system = [
    "Você é o copiloto do Ser Dono. Gere UM slogan curto (até 8 palavras) em português para a empresa descrita,",
    "coerente com o nicho, os valores e a personalidade da marca. Responda EXCLUSIVAMENTE com um objeto JSON",
    'no formato {"slogan":"..."}, sem markdown, sem texto antes ou depois.',
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
      max_tokens: 100,
      system,
      messages: [{ role: "user", content: JSON.stringify(ctx) }],
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
  const parsed = JSON.parse(cleaned) as { slogan: string };
  return parsed.slogan;
}

async function gerarLogoRascunho(estilo: Estilo, ctx: Contexto): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: montarPromptLogo(estilo, ctx),
      size: "1024x1024",
      quality: "low",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Images API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("Resposta de imagem vazia da OpenAI");
  return b64;
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

    const { jornada_instance_id, respostas } = (await req.json()) as {
      jornada_instance_id?: string;
      respostas?: Respostas;
    };
    if (!jornada_instance_id || !respostas) {
      return new Response(JSON.stringify({ error: "Campos 'jornada_instance_id' e 'respostas' são obrigatórios" }), {
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
    if (!instance.nome_empresa_escolhido) {
      return new Response(JSON.stringify({ error: "Escolha o nome da empresa antes de gerar a identidade visual" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const ctx: Contexto = {
      nome_empresa: instance.nome_empresa_escolhido,
      nicho: (instance.niches as { nome?: string } | null)?.nome ?? "negócio",
      respostas,
    };

    // Grava as respostas do questionário na etapa (dados_usuario), sem
    // marcar como concluída ainda — conclusão só na escolha do logo final.
    const { data: template } = await supabase
      .from("jornada_etapa_templates")
      .select("id")
      .eq("slug", "planejamento_identidade_visual")
      .single();
    if (template) {
      await supabase
        .from("jornada_etapas")
        .update({ dados_usuario: respostas })
        .eq("jornada_instance_id", jornada_instance_id)
        .eq("etapa_template_id", template.id);
    }

    const [slogan, ...logosBase64] = await Promise.all([
      gerarSlogan(ctx),
      ...ESTILOS.map((estilo) => gerarLogoRascunho(estilo, ctx)),
    ]);

    const candidatos = ESTILOS.map((estilo, i) => ({ estilo, imagem_base64: logosBase64[i] }));

    const { data: existente } = await supabase
      .from("jornada_deliverables")
      .select("versao")
      .eq("jornada_instance_id", jornada_instance_id)
      .eq("tipo", "identidade_visual")
      .maybeSingle();

    const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
      {
        jornada_instance_id,
        tipo: "identidade_visual",
        conteudo: { slogan, candidatos },
        gerado_por: "ia",
        versao: (existente?.versao ?? 0) + 1,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "jornada_instance_id,tipo" }
    );
    if (upsertError) throw upsertError;

    const { error: sloganError } = await supabase
      .from("jornada_instances")
      .update({ slogan_escolhido: slogan })
      .eq("id", jornada_instance_id);
    if (sloganError) throw sloganError;

    return new Response(JSON.stringify({ slogan, candidatos }), {
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
