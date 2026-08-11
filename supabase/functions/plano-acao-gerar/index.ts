// Ser Dono — Edge Function "plano-acao-gerar" (módulo Plano de Ação Mensal,
// pedido do dono do produto em 08/08/2026).
//
// Gera, numa chamada só, o plano de ação do mês corrente: 1 objetivo + 4
// semanas de itens de checklist, a partir do contexto real do negócio
// (Jornada, entregáveis, etapas já preenchidas) e do plano do mês anterior
// (se existir), pra dar continuidade em vez de repetir o que já foi feito.
//
// Mesmo padrão de auth de `jornada-gerar-documentos`: repassa o Authorization
// do chamador, sem service_role — RLS de `planos_acao`/`planos_acao_itens` já
// garante que só o dono grava. A trava "só um plano por mês" e "só depois da
// Fase 2 concluída" são checadas AQUI, no servidor — o botão desabilitado no
// client é só UX, não a fronteira de segurança de verdade.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

// Inline (não importado de packages/core/ai/routeModel.ts): o deploy via MCP
// não resolve import fora do diretório da function (mesma armadilha já
// documentada em admin-manage-user/index.ts pro corsHeaders). Geração de
// entregável final = modelo avançado (RN-10), mesmo caso de
// jornada-gerar-documentos.
const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

interface PlanoGerado {
  objetivo: string;
  semanas: { numero: number; itens: string[] }[];
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

/** Dia 1º do mês, no fuso de São Paulo — mesma convenção de `packages/core/planoAcao.ts::primeiroDiaMesAtualISO`, mas não importado por causa da armadilha de deploy documentada acima. */
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

function validarPlanoGerado(valor: unknown): valor is PlanoGerado {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  if (typeof v.objetivo !== "string" || !v.objetivo.trim()) return false;
  if (!Array.isArray(v.semanas) || v.semanas.length !== 4) return false;
  return v.semanas.every(
    (s) =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as { numero: unknown }).numero === "number" &&
      Array.isArray((s as { itens: unknown }).itens) &&
      (s as { itens: unknown[] }).itens.length > 0 &&
      (s as { itens: unknown[] }).itens.every((i) => typeof i === "string" && i.trim().length > 0)
  );
}

// deno-lint-ignore no-explicit-any
async function gerarPlano(contexto: Record<string, unknown>, mesReferenciaLabel: string, supabase: any, userId: string): Promise<PlanoGerado> {
  const system = [
    `Você é a Mary, copiloto do Ser Dono. Gere o Plano de Ação Mensal de ${mesReferenciaLabel} pra este empreendedor,`,
    "baseado SOMENTE no contexto real do negócio fornecido — nunca invente dado de mercado ou fato sobre o negócio",
    "que não esteja no contexto.",
    "O plano tem 1 objetivo central pro mês (uma frase curta e concreta, ex.: 'Aumentar vendas via clientes antigos')",
    "e 4 semanas, cada uma com 2 a 3 ações práticas, específicas e realizáveis em poucos dias — nunca vagas",
    "('divulgar mais' não serve; 'fazer 3 publicações no Instagram sobre a promoção' serve).",
    "Se houver um plano do mês anterior no contexto, leve em conta o que ficou marcado como NÃO concluído — dê",
    "prioridade a retomar isso antes de propor algo totalmente novo, em vez de ignorar o que ficou pendente.",
    "Se houver um check-up mensal no contexto (`checkup_mensal_mais_recente`), ele é o retrato mais atual e confiável",
    "do negócio — dê peso extra às prioridades e categorias em pior situação ali (status 'atencao'/'precisa_melhorar')",
    "na hora de montar o objetivo e as semanas, em vez de se basear só no progresso estrutural da Jornada.",
    "Se o contexto tiver pouca informação do negócio, gere um plano mais genérico de primeiros passos, mas nunca",
    "invente detalhe específico (nome de cliente, valor, concorrente) que não esteja no contexto.",
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"objetivo":string,"semanas":[{"numero":1,"itens":string[]},{"numero":2,"itens":string[]},{"numero":3,"itens":string[]},{"numero":4,"itens":string[]}]}',
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
    funcao: "plano-acao-gerar",
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
    throw new Error("Não foi possível interpretar o plano gerado — tente novamente");
  }
  if (!validarPlanoGerado(parsed)) {
    throw new Error("O plano gerado veio em formato inesperado — tente novamente");
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
    if (!instance || instance.fase_atual === "validacao_ideia") {
      return jsonResponse(
        { error: "O Plano de Ação Mensal libera depois que você concluir a Fase 2 (Validação da Ideia) da Jornada." },
        400
      );
    }

    const mesReferencia = primeiroDiaMesAtualISO();

    const { data: planoExistente } = await supabase
      .from("planos_acao")
      .select("id")
      .eq("user_id", user.id)
      .eq("mes_referencia", mesReferencia)
      .maybeSingle();
    if (planoExistente) {
      return jsonResponse({ error: "Você já gerou o plano deste mês — o próximo fica liberado no mês que vem." }, 409);
    }

    const [{ data: etapas }, { data: deliverables }, { data: planoAnterior }, { data: checkupAtual }, { data: checkupAnterior }] = await Promise.all([
      supabase
        .from("jornada_etapas")
        .select("dados_usuario, concluido_em, template:jornada_etapa_templates(titulo, fase, slug)")
        .eq("jornada_instance_id", instance.id)
        .eq("status", "concluida"),
      // `identidade_visual` fica de fora de propósito: `conteudo` guarda 3
      // logos em base64 (`LogoCandidato.imagem_base64`, `jornada.ts`), texto
      // irrelevante pro plano de ação — incluído sem querer, um teste real
      // mandou um prompt de 3,8 MILHÕES de tokens pro Anthropic (limite é
      // 200 mil) e a function inteira falhava com 400 antes de gravar nada.
      supabase
        .from("jornada_deliverables")
        .select("tipo, conteudo")
        .eq("jornada_instance_id", instance.id)
        .in("tipo", ["persona", "swot", "canvas", "proposta_valor"]),
      supabase
        .from("planos_acao")
        .select("id, objetivo, itens:planos_acao_itens(semana, titulo, concluido)")
        .eq("user_id", user.id)
        .eq("mes_referencia", mesAnteriorISO(mesReferencia))
        .maybeSingle(),
      // Check-up Mensal (módulo irmão, pedido explícito do dono do produto
      // de conectar os dois): se a pessoa já fez o check-up deste mês antes
      // de gerar o plano, a IA usa o raio-x de verdade em vez de só
      // inferir da Jornada. Sem o deste mês, cai pro do mês anterior — ainda
      // é sinal melhor que nenhum.
      supabase.from("checkups_mensais").select("respostas, saude").eq("user_id", user.id).eq("mes_referencia", mesReferencia).maybeSingle(),
      supabase
        .from("checkups_mensais")
        .select("respostas, saude")
        .eq("user_id", user.id)
        .eq("mes_referencia", mesAnteriorISO(mesReferencia))
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
      etapas_ja_concluidas: (etapas ?? []).map((e) => ({
        titulo: (e.template as unknown as { titulo: string; fase: string })?.titulo,
        fase: (e.template as unknown as { titulo: string; fase: string })?.fase,
        dados: e.dados_usuario,
      })),
      checkup_mensal_mais_recente: checkupAtual ?? checkupAnterior ?? null,
      plano_mes_anterior: planoAnterior
        ? { objetivo: planoAnterior.objetivo, itens: planoAnterior.itens }
        : null,
    };

    const mesLabel = new Date(`${mesReferencia}T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const gerado = await gerarPlano(contexto, mesLabel, supabase, user.id);

    const { data: plano, error: planoError } = await supabase
      .from("planos_acao")
      .insert({ user_id: user.id, mes_referencia: mesReferencia, objetivo: gerado.objetivo })
      .select()
      .single();
    if (planoError) throw planoError;

    const itensParaInserir = gerado.semanas.flatMap((semana) =>
      semana.itens.map((titulo, i) => ({ plano_id: plano.id, semana: semana.numero, ordem: i, titulo }))
    );
    const { data: itens, error: itensError } = await supabase.from("planos_acao_itens").insert(itensParaInserir).select();
    if (itensError) throw itensError;

    return jsonResponse({ plano, itens });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
