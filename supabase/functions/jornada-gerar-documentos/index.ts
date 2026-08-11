// Ser Dono — Edge Function "jornada-gerar-documentos" (Jornada Empreendedora,
// Fase 2: Validação da Ideia — SDD-32).
//
// Gera, numa chamada só, os 4 documentos da fase: Persona, SWOT, Canvas
// (Business Model Canvas) e Proposta de Valor — a partir do diagnóstico já
// respondido, do nicho escolhido e dos 3 inputs curtos que o usuário
// preencheu (público-alvo, concorrentes, diferenciais). Modelo avançado
// (RN-10: geração de entregável final), diferente do `diagnostic-match`
// (justificativa curta = caso econômico).
//
// Mesmo padrão de auth de `diagnostic-match`/`knowledge-search`: repassa o
// Authorization do chamador, sem service_role — RLS de jornada_deliverables
// já garante que só a dona da instância grava.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

// Inline (não importado de packages/core/ai/routeModel.ts): o deploy via MCP
// não resolve import fora do diretório da function (mesma armadilha já
// documentada em admin-manage-user/index.ts pro corsHeaders). O valor
// canônico e testável vive em packages/core, usado por quem builda via CLI.
const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const DOC_TIPOS = ["persona", "swot", "canvas", "proposta_valor"] as const;

interface DocumentosGerados {
  persona: { nome: string; idade: number; ocupacao: string; dores: string[]; desejos: string[]; comportamento: string };
  swot: { forcas: string[]; fraquezas: string[]; oportunidades: string[]; ameacas: string[] };
  canvas: {
    segmentos_clientes: string;
    proposta_valor: string;
    canais: string;
    relacionamento_clientes: string;
    fontes_receita: string;
    recursos_chave: string;
    atividades_chave: string;
    parcerias_chave: string;
    estrutura_custos: string;
  };
  proposta_valor: { headline: string; dores_resolvidas: string[]; ganhos_entregues: string[]; diferenciais: string[] };
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

// deno-lint-ignore no-explicit-any
async function gerarDocumentos(contexto: Record<string, unknown>, supabase: any, userId: string): Promise<DocumentosGerados> {
  const system = [
    "Você é o copiloto do Ser Dono, ajudando um empreendedor brasileiro a validar a ideia do negócio",
    "escolhido, na Fase 2 (Validação da Ideia) da Jornada Empreendedora.",
    "Gere 4 documentos estratégicos em português simples, baseados SOMENTE nos dados fornecidos —",
    "nunca invente dado de mercado que não esteja no contexto.",
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"persona":{"nome":string,"idade":number,"ocupacao":string,"dores":string[],"desejos":string[],"comportamento":string},',
    '"swot":{"forcas":string[],"fraquezas":string[],"oportunidades":string[],"ameacas":string[]},',
    '"canvas":{"segmentos_clientes":string,"proposta_valor":string,"canais":string,"relacionamento_clientes":string,"fontes_receita":string,"recursos_chave":string,"atividades_chave":string,"parcerias_chave":string,"estrutura_custos":string},',
    '"proposta_valor":{"headline":string,"dores_resolvidas":string[],"ganhos_entregues":string[],"diferenciais":string[]}}',
    "Cada campo de texto do canvas deve ser 1-2 frases curtas. Listas (dores, forcas, etc.) devem ter 3 a 5 itens cada.",
  ].join(" ");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL_AVANCADO,
      max_tokens: 2000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: JSON.stringify(contexto) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  await logIaUsage(supabase, {
    userId,
    funcao: "jornada-gerar-documentos",
    provider: "anthropic",
    modelo: AI_MODEL_AVANCADO,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  try {
    return extractJson(text) as DocumentosGerados;
  } catch {
    throw new Error("Não foi possível interpretar os documentos gerados — tente novamente");
  }
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

    const { jornada_instance_id } = await req.json();
    if (!jornada_instance_id) {
      return new Response(JSON.stringify({ error: "Campo 'jornada_instance_id' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria, perfil_cliente, playbook_md)")
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
    if (!instance.publico_alvo || !instance.concorrentes || !instance.diferenciais) {
      return new Response(JSON.stringify({ error: "Preencha público-alvo, concorrentes e diferenciais antes de gerar" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: diagnostico } = await supabase
      .from("diagnostic_responses")
      .select("capital_disponivel, objetivo, tempo_disponivel, formacao, experiencia, localizacao_cidade, localizacao_estado")
      .eq("user_id", user.id)
      .maybeSingle();

    const contexto = {
      nicho: instance.niches,
      publico_alvo: instance.publico_alvo,
      concorrentes: instance.concorrentes,
      diferenciais: instance.diferenciais,
      perfil_empreendedor: diagnostico,
    };

    const documentos = await gerarDocumentos(contexto, supabase, user.id);

    const { data: existentes } = await supabase
      .from("jornada_deliverables")
      .select("tipo, versao")
      .eq("jornada_instance_id", jornada_instance_id);
    const versaoAtual = new Map((existentes ?? []).map((d) => [d.tipo, d.versao]));

    for (const tipo of DOC_TIPOS) {
      const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
        {
          jornada_instance_id,
          tipo,
          conteudo: documentos[tipo],
          gerado_por: "ia",
          versao: (versaoAtual.get(tipo) ?? 0) + 1,
          gerado_em: new Date().toISOString(),
        },
        { onConflict: "jornada_instance_id,tipo" }
      );
      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ documentos }), {
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
