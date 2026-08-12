// Ser Dono — Edge Function "maturidade-calcular" (módulo Nível de Maturidade
// do Negócio + Ser Dono Score, pedido do dono do produto em 12/08/2026).
//
// Não existe pergunta nova pro usuário aqui: a Mary lê o que já existe em
// outros módulos (Jornada, Check-up Mensal, Plano de Ação, Raio-X
// Financeiro) e julga 5 categorias (financeiro/marketing/clientes/
// organizacao/crescimento), 0 a 100 cada, com um comentário curto. O score
// total (0-1000) e o nível (5 estágios) são sempre calculados aqui, de forma
// determinística, a partir das 5 notas — a IA nunca decide o total.
//
// Mesmo padrão de auth/estrutura de `checkup-gerar`/`plano-acao-gerar`:
// Authorization repassado, sem service_role; trava "só 1 por mês" checada no
// servidor via unique constraint.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

// Inline, não importado de packages/core/maturidadeNegocio.ts — mesma
// armadilha de deploy via MCP já documentada nas outras functions (não
// resolve import fora do diretório da function).
const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const CATEGORIAS = ["financeiro", "marketing", "clientes", "organizacao", "crescimento"] as const;

interface CategoriasGeradas {
  financeiro: { pontuacao: number; comentario: string };
  marketing: { pontuacao: number; comentario: string };
  clientes: { pontuacao: number; comentario: string };
  organizacao: { pontuacao: number; comentario: string };
  crescimento: { pontuacao: number; comentario: string };
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

function categoriaValida(v: unknown): v is { pontuacao: number; comentario: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { pontuacao: unknown }).pontuacao === "number" &&
    (v as { pontuacao: number }).pontuacao >= 0 &&
    (v as { pontuacao: number }).pontuacao <= 100 &&
    typeof (v as { comentario: unknown }).comentario === "string" &&
    (v as { comentario: string }).comentario.trim().length > 0
  );
}

function validarCategoriasGeradas(valor: unknown): valor is CategoriasGeradas {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return CATEGORIAS.every((c) => categoriaValida(v[c]));
}

/** Mesma fórmula de `packages/core/maturidadeNegocio.ts::calcularPontuacaoTotal` — média das 5 categorias × 10. */
function calcularPontuacaoTotal(categorias: CategoriasGeradas): number {
  const soma = CATEGORIAS.reduce((acc, c) => acc + categorias[c].pontuacao, 0);
  const media = soma / CATEGORIAS.length;
  return Math.max(0, Math.min(1000, Math.round(media * 10)));
}

/** Mesma fórmula de `packages/core/maturidadeNegocio.ts::nivelDaPontuacao` — faixas de 200 pontos. */
function nivelDaPontuacao(pontuacaoTotal: number): string {
  if (pontuacaoTotal < 200) return "iniciante";
  if (pontuacaoTotal < 400) return "em_operacao";
  if (pontuacaoTotal < 600) return "em_crescimento";
  if (pontuacaoTotal < 800) return "estruturado";
  return "preparado_escalar";
}

// deno-lint-ignore no-explicit-any
async function gerarCategorias(contexto: Record<string, unknown>, supabase: any, userId: string): Promise<CategoriasGeradas> {
  const system = [
    "Você é a Mary, copiloto do Ser Dono. Vou te passar o retrato mais recente do negócio de um empreendedor",
    "brasileiro — o que ele já preencheu na Jornada, no Check-up Mensal, no Plano de Ação e no Raio-X Financeiro,",
    "quando existirem. Com base SOMENTE nesses dados (nunca invente fato nem compare com médias de mercado — a leitura",
    "é sempre sobre o negócio dele mesmo, nunca contra concorrência), avalie 5 categorias: financeiro, marketing,",
    "clientes, organizacao e crescimento.",
    "Para CADA categoria, dê uma pontuação de 0 a 100 (quanto mais estruturada/saudável a categoria parece pelos",
    "dados disponíveis, maior a nota) e um comentário curto (1 a 2 frases, em português simples, honesto — nunca",
    "otimista demais nem alarmista demais) explicando por que a nota é essa. Se não houver dado suficiente pra avaliar",
    "bem uma categoria, diga isso explicitamente no comentário e dê uma nota mais baixa e cautelosa (nunca inflar por",
    "falta de informação).",
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"financeiro":{"pontuacao":number,"comentario":string},"marketing":{"pontuacao":number,"comentario":string},"clientes":{"pontuacao":number,"comentario":string},"organizacao":{"pontuacao":number,"comentario":string},"crescimento":{"pontuacao":number,"comentario":string}}',
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
  await logIaUsage(supabase, {
    userId,
    funcao: "maturidade-calcular",
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
    throw new Error("Não foi possível interpretar a avaliação gerada — tente novamente");
  }
  if (!validarCategoriasGeradas(parsed)) {
    throw new Error("A avaliação gerada veio em formato inesperado — tente novamente");
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

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance) {
      return jsonResponse({ error: "O Nível de Maturidade libera depois que você começar a Jornada." }, 400);
    }

    const mesReferencia = primeiroDiaMesAtualISO();

    const { data: snapshotExistente } = await supabase
      .from("maturidade_snapshots")
      .select("id")
      .eq("user_id", user.id)
      .eq("mes_referencia", mesReferencia)
      .maybeSingle();
    if (snapshotExistente) {
      return jsonResponse({ error: "Seu nível deste mês já foi calculado — o próximo cálculo fica liberado no mês que vem." }, 409);
    }

    const [{ data: etapas }, { data: checkupAtual }, { data: checkupAnterior }, { data: planoAtual }, { data: fechamentos }] = await Promise.all([
      supabase
        .from("jornada_etapas")
        .select("status, template:jornada_etapa_templates(fase)")
        .eq("jornada_instance_id", instance.id),
      supabase.from("checkups_mensais").select("respostas, saude").eq("user_id", user.id).eq("mes_referencia", mesReferencia).maybeSingle(),
      supabase
        .from("checkups_mensais")
        .select("respostas, saude")
        .eq("user_id", user.id)
        .eq("mes_referencia", mesAnteriorISO(mesReferencia))
        .maybeSingle(),
      supabase
        .from("planos_acao")
        .select("id, objetivo, itens:planos_acao_itens(semana, titulo, concluido)")
        .eq("user_id", user.id)
        .order("mes_referencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("raiox_financeiro_mensal").select("mes_referencia, faturamento, despesas, retirada_socio").eq("user_id", user.id).order("mes_referencia", { ascending: false }).limit(2),
    ]);

    const contexto = {
      negocio: {
        nome_empresa: instance.nome_empresa_escolhido ?? instance.nome_negocio,
        nicho: instance.niches,
        regime_formalizacao: instance.regime_formalizacao,
        fase_atual: instance.fase_atual,
      },
      etapas_jornada: (etapas ?? []).map((e: { status: string; template: unknown }) => ({
        fase: (e.template as { fase: string } | null)?.fase,
        status: e.status,
      })),
      checkup_mensal_mais_recente: checkupAtual ?? checkupAnterior ?? null,
      plano_acao_mais_recente: planoAtual ?? null,
      raio_x_financeiro_ultimos_meses: fechamentos ?? [],
    };

    const categorias = await gerarCategorias(contexto, supabase, user.id);
    const pontuacaoTotal = calcularPontuacaoTotal(categorias);
    const nivel = nivelDaPontuacao(pontuacaoTotal);

    const { data: snapshot, error: snapshotError } = await supabase
      .from("maturidade_snapshots")
      .insert({ user_id: user.id, mes_referencia: mesReferencia, categorias, pontuacao_total: pontuacaoTotal, nivel })
      .select()
      .single();
    if (snapshotError) throw snapshotError;

    return jsonResponse({ snapshot });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
