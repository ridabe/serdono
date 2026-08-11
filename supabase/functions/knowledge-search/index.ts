// Ser Dono — Edge Function "knowledge-search" (RAG de conhecimento geral).
//
// Serviço reutilizável em qualquer módulo do produto (diagnóstico, workflow,
// futuro chat livre do copiloto): recebe uma pergunta em linguagem natural
// sobre empreendedorismo/MEI, finanças pessoais ou investimentos, busca os
// trechos mais relevantes da base de conhecimento (busca por similaridade de
// embeddings, pgvector) e pede ao Claude para sintetizar uma resposta curta
// citando a fonte de cada trecho usado — nunca inventando dado fora da base
// (RN-20, RF-3, mesmo guardrail do diagnostic-match).
//
// Se a pergunta não tiver nada relevante na base (similaridade baixa), a
// função responde honestamente que não tem essa informação, em vez de deixar
// o modelo alucinar uma resposta genérica.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logIaUsage } from "../_shared/ia-usage.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"; // RN-10: síntese curta é caso econômico

const MATCH_COUNT = 5;
const MIN_SIMILARITY = 0.3; // abaixo disso, tratamos como "não achamos nada relevante"

interface KnowledgeMatch {
  chunk_id: string;
  article_id: string;
  content: string;
  similarity: number;
  article_titulo: string;
  article_resumo: string;
  fonte: string;
  fonte_url: string | null;
  fonte_data: string;
  category_slug: string;
}

/**
 * Contexto do negócio do próprio usuário (SDD-50, RN-11) — o que permite a
 * Mary conversar sobre "o seu processo", não só sobre empreendedorismo em
 * geral. Sempre opcional: sessão anônima ou usuário sem a Jornada liberada
 * continua usando a função exatamente como antes.
 */
interface BusinessContext {
  nomeUsuario: string | null;
  nomeEmpresa: string | null;
  nicho: string | null;
  /** Rótulo já pronto pra citar ("Organização", "Formalização"...) — nunca "concluida" cru, que não é nome de fase nenhuma. */
  faseAtualLabel: string;
  jornadaConcluida: boolean;
  regime: string | null;
  publicoAlvo: string | null;
  diferenciais: string | null;
}

// Rótulos das fases reais do motor (mesma lista de `packages/core/jornadaProgresso.ts`,
// duplicada aqui de propósito — Edge Function Deno não importa o monorepo TS).
const FASE_LABEL: Record<string, string> = {
  validacao_ideia: "Validação da Ideia",
  planejamento: "Planejamento",
  formalizacao: "Formalização",
  financeiro: "Financeiro",
  estrutura: "Estrutura",
  fornecedores: "Fornecedores",
  produto: "Produto",
  marketing: "Marketing",
  clientes: "Clientes",
  primeira_venda: "Primeira Venda",
  organizacao: "Organização",
};

// deno-lint-ignore no-explicit-any
async function loadBusinessContext(client: any, userId: string): Promise<BusinessContext | null> {
  const { data: instance } = await client
    .from("jornada_instances")
    .select("fase_atual, nome_empresa_escolhido, regime_formalizacao, publico_alvo, diferenciais, niche_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!instance) return null;

  const [{ data: perfil }, { data: niche }] = await Promise.all([
    client.from("users").select("nome").eq("id", userId).maybeSingle(),
    instance.niche_id
      ? client.from("niches").select("nome").eq("id", instance.niche_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const jornadaConcluida = instance.fase_atual === "concluida";
  return {
    nomeUsuario: perfil?.nome ?? null,
    nomeEmpresa: instance.nome_empresa_escolhido,
    nicho: niche?.nome ?? null,
    faseAtualLabel: jornadaConcluida ? "Concluída (100%)" : (FASE_LABEL[instance.fase_atual] ?? instance.fase_atual),
    jornadaConcluida,
    regime: instance.regime_formalizacao,
    publicoAlvo: instance.publico_alvo,
    diferenciais: instance.diferenciais,
  };
}

// deno-lint-ignore no-explicit-any
async function embedQuestion(question: string, supabase: any, userId: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: question }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI embeddings error (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
  await logIaUsage(supabase, {
    userId,
    funcao: "knowledge-search",
    provider: "openai",
    modelo: "text-embedding-3-small",
    inputTokens: data.usage?.prompt_tokens ?? null,
    outputTokens: null,
  });
  return data.data[0].embedding;
}

async function synthesizeAnswer(
  question: string,
  matches: KnowledgeMatch[],
  negocio: BusinessContext | null,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string
): Promise<string> {
  // Prefixo FIXO — é o que o cache de prompt guarda (RN-12). O contexto do
  // negócio varia por usuário, então vai na mensagem, nunca aqui: colocá-lo
  // no bloco cacheado invalidaria o cache a cada pessoa diferente.
  const system = [
    "Você é a Mary, a mentora do Ser Dono que acompanha o empreendedor. Fale sempre em primeira",
    "pessoa, como a Mary — nunca se refira a si mesma como 'a IA', 'assistente virtual' ou 'modelo'.",
    "Você responde dúvidas sobre empreendedorismo, MEI, finanças pessoais e investimentos, e também",
    "sobre o negócio específico da pessoa quando o contexto dele for fornecido.",
    "Regras de veracidade, nesta ordem:",
    "(1) Fato geral, regra, norma, prazo ou valor SÓ pode sair dos trechos da base de conhecimento —",
    "nunca invente nenhum. Ao usar um trecho, cite ao final no formato 'Fonte: <nome>, <data>'.",
    "(2) Fato sobre o negócio da pessoa (nome, nicho, fase, público) só pode sair do bloco de contexto",
    "do negócio — não deduza, não preencha lacuna com suposição, e NUNCA calcule ou estime número",
    "(quantidade de etapas, percentual, prazo) que não esteja literalmente ali. 'faseAtualLabel' e",
    "'jornadaConcluida' são o status real e têm sempre a palavra final: se 'jornadaConcluida' for true,",
    "a jornada terminou — nunca diga que a pessoa está 'na metade do caminho', tem 'etapas restantes' ou",
    "algo parecido, mesmo que outro dado do contexto pareça sugerir isso.",
    "(3) Se não houver trecho nem contexto que sustente a resposta, diga honestamente que ainda não",
    "tem essa informação, em vez de arriscar uma resposta genérica. Nunca invente 'Fonte:' para algo",
    "que veio do contexto do negócio — contexto do negócio não é fonte bibliográfica.",
    "Se a pergunta fugir de empreendedorismo e do negócio da pessoa, redirecione com gentileza.",
    "Responda em português simples, 2 a 5 frases, texto plano (sem markdown).",
  ].join(" ");

  const contexto = matches.map((m) => ({
    titulo: m.article_titulo,
    trecho: m.content,
    fonte: m.fonte,
    fonte_data: m.fonte_data,
  }));

  const partes = [`Pergunta: ${question}`];
  if (negocio) partes.push(`Contexto do negócio desta pessoa:\n${JSON.stringify(negocio, null, 2)}`);
  partes.push(
    contexto.length > 0
      ? `Trechos da base de conhecimento:\n${JSON.stringify(contexto, null, 2)}`
      : "Nenhum trecho relevante foi encontrado na base de conhecimento para esta pergunta."
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: partes.join("\n\n") }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
  await logIaUsage(supabase, {
    userId,
    funcao: "knowledge-search",
    provider: "anthropic",
    modelo: ANTHROPIC_MODEL,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  return data.content?.[0]?.text?.trim() ?? "";
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

    const { question, category } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Campo 'question' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Autenticação apenas confirma que é uma sessão válida (anônima ou real) —
    // este serviço é "disponibilizado a todos" os usuários do produto, sem
    // gate de assinatura, mas ainda exige sessão pra manter uso rastreável.
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

    const embedding = await embedQuestion(question, supabase, user.id);
    const vectorLiteral = `[${embedding.join(",")}]`;

    // O contexto do negócio é best-effort: qualquer falha aqui (usuário sem
    // Jornada, sessão anônima, RLS) degrada pro comportamento antigo — a
    // pergunta ainda é respondida pela base, só sem personalização.
    const [{ data: matches, error: matchError }, negocio] = await Promise.all([
      supabase.rpc("match_knowledge_chunks", {
        query_embedding: vectorLiteral,
        match_count: MATCH_COUNT,
        filter_category_slug: category ?? null,
      }),
      loadBusinessContext(supabase, user.id).catch(() => null),
    ]);
    if (matchError) throw matchError;

    const relevant = ((matches as KnowledgeMatch[]) ?? []).filter((m) => m.similarity >= MIN_SIMILARITY);

    // Sem trecho relevante E sem contexto do negócio, não há o que sustentar
    // uma resposta — mantemos a recusa honesta. Com contexto, a Mary ainda
    // pode falar sobre o processo da própria pessoa (SDD-50), que por
    // definição não está na base de conhecimento.
    if (relevant.length === 0 && !negocio) {
      return new Response(
        JSON.stringify({
          answer: "Ainda não tenho informação suficiente sobre isso na nossa base de conhecimento.",
          sources: [],
        }),
        { headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const answer = await synthesizeAnswer(question, relevant, negocio, supabase, user.id);

    const sources = relevant.map((m) => ({
      titulo: m.article_titulo,
      fonte: m.fonte,
      fonte_data: m.fonte_data,
      similarity: Math.round(m.similarity * 100) / 100,
      category: m.category_slug,
    }));

    return new Response(JSON.stringify({ answer, sources }), {
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
