// Ser Dono — Edge Function "jornada-gerar-oferta" (Jornada Empreendedora,
// Fase Clientes: Captação de Clientes, SDD-45).
//
// Gera a oferta comercial estruturada (produto, benefício, diferencial,
// condição, prazo, CTA) usando o que a jornada já sabe sobre o negócio
// (nome, slogan, nicho, persona e proposta de valor já gerados na Fase 2),
// mesmo contexto reaproveitado por jornada-gerar-marketing (SDD-43).
//
// Modelo avançado (RN-10: geração de entregável final). Pode ser chamada
// quantas vezes o usuário quiser (mesmo padrão de Marketing, RN-26) — cada
// chamada sobrescreve o conteúdo anterior via upsert, incrementando `versao`.

import { createClient } from "npm:@supabase/supabase-js@2";

const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

interface OfertaComercial {
  produto: string;
  beneficio: string;
  diferencial: string;
  condicao: string;
  prazo: string;
  cta: string;
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

async function gerarOferta(contexto: Record<string, unknown>): Promise<OfertaComercial> {
  const system = [
    "Você é o copiloto do Ser Dono, ajudando um empreendedor brasileiro a estruturar a oferta comercial que vai usar",
    "na Fase Clientes (Captação de Clientes) da Jornada Empreendedora. Gere, com base SOMENTE nos dados fornecidos,",
    "uma oferta comercial com: produto (o que está sendo oferecido, em 1 frase), beneficio (o que o cliente ganha),",
    "diferencial (por que escolher este negócio e não outro), condicao (uma condição comercial genérica e razoável,",
    "ex.: desconto de primeira compra — nunca um valor específico em R$ ou % que não esteja no contexto), prazo",
    "(por quanto tempo a condição vale, ex.: 15 dias) e cta (chamada para ação curta e direta). Nunca invente preço,",
    "desconto numérico específico ou promoção que não esteja no contexto — mantenha a condição genérica o suficiente",
    "pro empreendedor completar com a oferta real dele. Responda EXCLUSIVAMENTE com um objeto JSON válido, sem",
    "markdown, sem texto antes ou depois, no formato:",
    '{"produto":string,"beneficio":string,"diferencial":string,"condicao":string,"prazo":string,"cta":string}',
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
      max_tokens: 1000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: JSON.stringify(contexto) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  try {
    return extractJson(text) as OfertaComercial;
  } catch {
    throw new Error("Não foi possível interpretar o conteúdo gerado — tente novamente");
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

    const { jornada_instance_id } = (await req.json()) as { jornada_instance_id?: string };
    if (!jornada_instance_id) {
      return new Response(JSON.stringify({ error: "Campo 'jornada_instance_id' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria, perfil_cliente)")
      .eq("id", jornada_instance_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance || !instance.nome_empresa_escolhido) {
      return new Response(JSON.stringify({ error: "Escolha o nome da empresa antes de gerar a oferta comercial" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: deliverables } = await supabase
      .from("jornada_deliverables")
      .select("tipo, conteudo")
      .eq("jornada_instance_id", jornada_instance_id)
      .in("tipo", ["persona", "proposta_valor"]);
    const porTipo = new Map((deliverables ?? []).map((d) => [d.tipo, d.conteudo]));

    const contexto = {
      nome_empresa: instance.nome_empresa_escolhido,
      slogan: instance.slogan_escolhido,
      nicho: instance.niches,
      persona: porTipo.get("persona") ?? null,
      proposta_valor: porTipo.get("proposta_valor") ?? null,
    };

    const oferta = await gerarOferta(contexto);

    const { data: existente } = await supabase
      .from("jornada_deliverables")
      .select("versao")
      .eq("jornada_instance_id", jornada_instance_id)
      .eq("tipo", "clientes_oferta")
      .maybeSingle();

    const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
      {
        jornada_instance_id,
        tipo: "clientes_oferta",
        conteudo: oferta,
        gerado_por: "ia",
        versao: (existente?.versao ?? 0) + 1,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "jornada_instance_id,tipo" }
    );
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify(oferta), {
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
