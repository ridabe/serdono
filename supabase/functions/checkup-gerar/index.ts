// Ser Dono — Edge Function "checkup-gerar" (módulo Check-up Mensal do
// Negócio, prioridade nº 1 do dono do produto, pedido em 08/08/2026).
//
// Recebe as respostas do questionário mensal (4 seções: Financeiro,
// Clientes, Marketing, Operação) e devolve um raio-x qualitativo do
// negócio: status por categoria (bom/atenção/precisa melhorar), pontuação
// geral 0-100 e as 3 prioridades do mês. Mesmo padrão de auth/estrutura de
// `plano-acao-gerar` (SDD-86): Authorization repassado, sem service_role;
// trava "só 1 por mês" checada no servidor via unique constraint.

import { createClient } from "npm:@supabase/supabase-js@2";

// Inline, não importado de packages/core/ai/routeModel.ts — mesma armadilha
// de deploy via MCP já documentada nas outras functions. Geração de
// entregável final = modelo avançado (RN-10).
const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const STATUS_VALIDOS = ["bom", "atencao", "precisa_melhorar"];

interface SaudeGerada {
  financeiro: { status: string; comentario: string };
  clientes: { status: string; comentario: string };
  marketing: { status: string; comentario: string };
  operacao: { status: string; comentario: string };
  pontuacao_geral: number;
  prioridades: string[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

function primeiroDiaMesAtualISO(): string {
  const agoraSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const ano = agoraSP.getFullYear();
  const mes = String(agoraSP.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

function mesAnteriorISO(mesReferenciaISO: string): string {
  const [ano, mes] = mesReferenciaISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  data.setUTCMonth(data.getUTCMonth() - 1);
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function categoriaValida(v: unknown): v is { status: string; comentario: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    STATUS_VALIDOS.includes((v as { status: unknown }).status as string) &&
    typeof (v as { comentario: unknown }).comentario === "string" &&
    (v as { comentario: string }).comentario.trim().length > 0
  );
}

function validarSaudeGerada(valor: unknown): valor is SaudeGerada {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  if (!categoriaValida(v.financeiro) || !categoriaValida(v.clientes) || !categoriaValida(v.marketing) || !categoriaValida(v.operacao)) return false;
  if (typeof v.pontuacao_geral !== "number" || v.pontuacao_geral < 0 || v.pontuacao_geral > 100) return false;
  if (!Array.isArray(v.prioridades) || v.prioridades.length !== 3) return false;
  return v.prioridades.every((p) => typeof p === "string" && p.trim().length > 0);
}

async function gerarSaude(contexto: Record<string, unknown>): Promise<SaudeGerada> {
  const system = [
    "Você é a Mary, copiloto do Ser Dono. Um empreendedor brasileiro acabou de responder o check-up mensal do negócio",
    "dele — respostas curtas sobre financeiro, clientes, marketing e operação. Analise SOMENTE essas respostas (e o",
    "check-up do mês anterior, se houver, só pra contexto de tendência) e devolva um raio-x qualitativo honesto — nunca",
    "otimista demais nem alarmista demais, e nunca invente fato que não esteja nas respostas (não estime valor exato",
    "de faturamento, não afirme causa que a pessoa não relatou).",
    "Para CADA categoria (financeiro, clientes, marketing, operacao), dê um status entre exatamente estes 3 valores:",
    '"bom", "atencao" ou "precisa_melhorar", com um comentário curto (1 frase) explicando por quê, em português',
    "simples.",
    "Dê uma pontuação geral de 0 a 100 (média ponderada do seu julgamento sobre as 4 categorias, não uma fórmula",
    "exposta ao usuário).",
    "Dê exatamente 3 prioridades pro próximo mês — ações concretas, específicas às respostas dadas, nunca genéricas",
    '("melhorar o marketing" não serve; "postar 2x por semana no Instagram, que foi seu canal parado este mês" serve).',
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"financeiro":{"status":string,"comentario":string},"clientes":{"status":string,"comentario":string},"marketing":{"status":string,"comentario":string},"operacao":{"status":string,"comentario":string},"pontuacao_geral":number,"prioridades":[string,string,string]}',
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
      max_tokens: 1200,
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

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    throw new Error("Não foi possível interpretar o check-up gerado — tente novamente");
  }
  if (!validarSaudeGerada(parsed)) {
    throw new Error("O check-up gerado veio em formato inesperado — tente novamente");
  }
  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Faltando header Authorization" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Sessão inválida" }, 401);
    }

    const { respostas } = await req.json();
    if (typeof respostas !== "object" || respostas === null || Array.isArray(respostas)) {
      return jsonResponse({ error: "Campo 'respostas' é obrigatório" }, 400);
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance) {
      return jsonResponse({ error: "O Check-up Mensal libera depois que você começar a Jornada." }, 400);
    }

    const mesReferencia = primeiroDiaMesAtualISO();

    const { data: checkupExistente } = await supabase
      .from("checkups_mensais")
      .select("id")
      .eq("user_id", user.id)
      .eq("mes_referencia", mesReferencia)
      .maybeSingle();
    if (checkupExistente) {
      return jsonResponse({ error: "Você já fez o check-up deste mês — o próximo fica liberado no mês que vem." }, 409);
    }

    const { data: checkupAnterior } = await supabase
      .from("checkups_mensais")
      .select("respostas, saude")
      .eq("user_id", user.id)
      .eq("mes_referencia", mesAnteriorISO(mesReferencia))
      .maybeSingle();

    const contexto = {
      negocio: {
        nome_empresa: instance.nome_empresa_escolhido ?? instance.nome_negocio,
        nicho: instance.niches,
        regime_formalizacao: instance.regime_formalizacao,
      },
      respostas_deste_mes: respostas,
      checkup_mes_anterior: checkupAnterior ?? null,
    };

    const saude = await gerarSaude(contexto);

    const { data: checkup, error: checkupError } = await supabase
      .from("checkups_mensais")
      .insert({ user_id: user.id, mes_referencia: mesReferencia, respostas, saude })
      .select()
      .single();
    if (checkupError) throw checkupError;

    return jsonResponse({ checkup });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
