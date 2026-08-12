// Ser Dono — Edge Function "reuniao-gerar" (módulo Assistente de Reunião,
// pedido do dono do produto em 12/08/2026, V1).
//
// Recebe tipo de reunião + com quem + objetivo + observações e devolve um
// guia de preparação (resumo, pauta, perguntas a fazer, dicas de
// comportamento, erros a evitar, checklist), lendo o contexto real do
// negócio do usuário (Jornada, entregáveis, Check-up, Plano de Ação,
// Raio-X). Mesmo padrão de auth/estrutura de `plano-acao-gerar`:
// Authorization repassado, sem service_role.
//
// Diferente dos módulos mensais (Check-up/Plano de Ação/Nível de
// Maturidade): SEM trava de "1 por mês" — o usuário pode gerar quantos
// guias precisar, cada um vira uma linha nova em `reunioes` (histórico).

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

// Inline, não importado de packages/core/reuniao.ts — mesma armadilha de
// deploy via MCP já documentada nas outras functions (não resolve import
// fora do diretório da function).
const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const TIPOS_VALIDOS = ["fornecedor", "cliente_prospect", "investidor", "parceiro", "banco_credito", "outro"];

interface GuiaGerado {
  resumo: string;
  pauta: string[];
  perguntas_a_fazer: string[];
  dicas_comportamento: string[];
  erros_a_evitar: string[];
  checklist_preparacao: string[];
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

function arrayValido(v: unknown, minimo: number): v is string[] {
  return Array.isArray(v) && v.length >= minimo && v.every((s) => typeof s === "string" && s.trim().length > 0);
}

function validarGuiaGerado(valor: unknown): valor is GuiaGerado {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  if (typeof v.resumo !== "string" || !v.resumo.trim()) return false;
  if (!arrayValido(v.pauta, 3)) return false;
  if (!arrayValido(v.perguntas_a_fazer, 2)) return false;
  if (!arrayValido(v.dicas_comportamento, 2)) return false;
  if (!arrayValido(v.erros_a_evitar, 2)) return false;
  if (!arrayValido(v.checklist_preparacao, 3)) return false;
  return true;
}

const TIPO_LABEL: Record<string, string> = {
  fornecedor: "Fornecedor",
  cliente_prospect: "Cliente ou prospect",
  investidor: "Investidor",
  parceiro: "Parceiro de negócio",
  banco_credito: "Banco / crédito",
  outro: "Outro",
};

// deno-lint-ignore no-explicit-any
async function gerarGuia(contexto: Record<string, unknown>, supabase: any, userId: string): Promise<GuiaGerado> {
  const system = [
    "Você é a Mary, copiloto do Ser Dono. Um empreendedor brasileiro vai ter uma reunião e precisa de um guia de",
    "preparação. Use SOMENTE o contexto real do negócio fornecido (nunca invente dado de mercado, nome de",
    "concorrente ou número que não esteja no contexto).",
    "Adapte o tom e o conteúdo ao TIPO da reunião — uma reunião com fornecedor pede foco em negociação de preço/prazo,",
    "com investidor pede clareza de números e visão de crescimento, com cliente/prospect pede foco na dor que o",
    "negócio resolve, com banco/crédito pede organização financeira. Diferencie de verdade, nunca dê o mesmo",
    "conteúdo genérico pra tipos diferentes.",
    "O campo `objetivo` e `observacoes` (quando houver) informados pelo usuário são o sinal mais específico que você",
    "tem — a pauta e as dicas têm que girar em torno deles, nunca ser genéricas quando esses campos dão um contexto",
    "claro.",
    "Devolva:",
    "- `resumo`: 1-2 frases enquadrando como abordar essa reunião especificamente.",
    "- `pauta`: pelo menos 3 tópicos concretos a cobrir, na ordem que fazem sentido conversar.",
    "- `perguntas_a_fazer`: pelo menos 2 perguntas que o empreendedor deveria fazer na reunião.",
    "- `dicas_comportamento`: pelo menos 2 dicas de postura/tom específicas pro tipo desta reunião.",
    "- `erros_a_evitar`: pelo menos 2 erros comuns nesse tipo de reunião.",
    "- `checklist_preparacao`: pelo menos 3 itens pra preparar/levar antes da reunião.",
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"resumo":string,"pauta":string[],"perguntas_a_fazer":string[],"dicas_comportamento":string[],"erros_a_evitar":string[],"checklist_preparacao":string[]}',
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
      max_tokens: 1500,
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
    funcao: "reuniao-gerar",
    provider: "anthropic",
    modelo: AI_MODEL_AVANCADO,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    throw new Error("Não foi possível interpretar o guia gerado — tente novamente");
  }
  if (!validarGuiaGerado(parsed)) {
    throw new Error("O guia gerado veio em formato inesperado — tente novamente");
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

    const body = await req.json();
    const { tipo, tipo_outro_detalhe, com_quem, objetivo, observacoes } = body ?? {};

    if (typeof tipo !== "string" || !TIPOS_VALIDOS.includes(tipo)) {
      return jsonResponse({ error: "Tipo de reunião inválido" }, 400);
    }
    if (tipo === "outro" && (typeof tipo_outro_detalhe !== "string" || !tipo_outro_detalhe.trim())) {
      return jsonResponse({ error: "Conte com quem mais é a reunião quando o tipo for 'Outro'" }, 400);
    }
    if (typeof com_quem !== "string" || !com_quem.trim()) {
      return jsonResponse({ error: "Campo 'com_quem' é obrigatório" }, 400);
    }
    if (typeof objetivo !== "string" || !objetivo.trim()) {
      return jsonResponse({ error: "Campo 'objetivo' é obrigatório" }, 400);
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance) {
      return jsonResponse({ error: "O Assistente de Reunião libera depois que você começar a Jornada." }, 400);
    }

    const [{ data: deliverables }, { data: checkupAtual }, { data: planoAtual }, { data: raiox }] = await Promise.all([
      supabase
        .from("jornada_deliverables")
        .select("tipo, conteudo")
        .eq("jornada_instance_id", instance.id)
        .in("tipo", ["persona", "swot", "canvas", "proposta_valor"]),
      supabase
        .from("checkups_mensais")
        .select("respostas, saude")
        .eq("user_id", user.id)
        .order("mes_referencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("planos_acao")
        .select("id, objetivo, itens:planos_acao_itens(semana, titulo, concluido)")
        .eq("user_id", user.id)
        .order("mes_referencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("raiox_financeiro_mensal")
        .select("mes_referencia, faturamento, despesas, retirada_socio")
        .eq("user_id", user.id)
        .order("mes_referencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const contexto = {
      negocio: {
        nome_empresa: instance.nome_empresa_escolhido ?? instance.nome_negocio,
        nicho: instance.niches,
        regime_formalizacao: instance.regime_formalizacao,
        fase_atual: instance.fase_atual,
      },
      entregaveis_estrategicos: deliverables ?? [],
      checkup_mensal_mais_recente: checkupAtual ?? null,
      plano_acao_mais_recente: planoAtual ?? null,
      raiox_financeiro_mais_recente: raiox ?? null,
      reuniao: {
        tipo,
        tipo_label: TIPO_LABEL[tipo],
        tipo_outro_detalhe: tipo_outro_detalhe ?? null,
        com_quem,
        objetivo,
        observacoes: observacoes ?? null,
      },
    };

    const guia = await gerarGuia(contexto, supabase, user.id);

    const { data: reuniao, error: reuniaoError } = await supabase
      .from("reunioes")
      .insert({
        user_id: user.id,
        tipo,
        tipo_outro_detalhe: tipo_outro_detalhe ?? null,
        com_quem,
        objetivo,
        observacoes: observacoes ?? null,
        guia,
      })
      .select()
      .single();
    if (reuniaoError) throw reuniaoError;

    return jsonResponse({ reuniao });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
