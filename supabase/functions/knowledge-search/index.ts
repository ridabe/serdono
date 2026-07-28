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

async function embedQuestion(question: string): Promise<number[]> {
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
  return data.data[0].embedding;
}

async function synthesizeAnswer(question: string, matches: KnowledgeMatch[]): Promise<string> {
  const system = [
    "Você é o copiloto do Ser Dono, respondendo dúvidas de empreendedores sobre MEI, finanças",
    "pessoais e investimentos. Responda SOMENTE com base nos trechos fornecidos abaixo — nunca",
    "invente informação, regra, valor ou norma que não esteja neles. Se os trechos não derem conta",
    "da pergunta, diga honestamente que não tem essa informação na base ainda, em vez de arriscar",
    "uma resposta genérica.",
    "Responda em português simples, 2 a 4 frases, texto plano (sem markdown). Ao final, cite a fonte",
    "no formato 'Fonte: <nome>, <data>' — se mais de um trecho de fonte diferente foi usado, cite todas.",
  ].join(" ");

  const contexto = matches.map((m) => ({
    titulo: m.article_titulo,
    trecho: m.content,
    fonte: m.fonte,
    fonte_data: m.fonte_data,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Pergunta: ${question}\n\nTrechos da base de conhecimento:\n${JSON.stringify(contexto, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
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

    const embedding = await embedQuestion(question);
    const vectorLiteral = `[${embedding.join(",")}]`;

    const { data: matches, error: matchError } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: vectorLiteral,
      match_count: MATCH_COUNT,
      filter_category_slug: category ?? null,
    });
    if (matchError) throw matchError;

    const relevant = ((matches as KnowledgeMatch[]) ?? []).filter((m) => m.similarity >= MIN_SIMILARITY);

    if (relevant.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "Ainda não tenho informação suficiente sobre isso na nossa base de conhecimento.",
          sources: [],
        }),
        { headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const answer = await synthesizeAnswer(question, relevant);

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
