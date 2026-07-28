// Ser Dono — Edge Function "diagnostic-match" (PRD §7-8, SPEC §5).
//
// Roda depois que o usuário conclui o questionário do diagnóstico:
// 1. Calcula o Fit Score dos nichos ativos — fórmula determinística de
//    packages/core/fitScore.ts, a MESMA usada no restante do produto
//    (SDD-3: lógica de negócio única, nunca duplicada).
// 2. Chama Claude (Haiku — RN-10, baixa complexidade) só para escrever a
//    justificativa em linguagem natural dos 3 melhores nichos (RN-7) —
//    a nota em si nunca é decidida pela IA.
// 3. Grava tudo em niche_matches e devolve a prévia para o client.
//
// A chamada nunca acontece direto do client (protege ANTHROPIC_API_KEY,
// SPEC §5) — o client só invoca esta função autenticado com o próprio JWT
// (sessão anônima ou real), que a função repassa ao Supabase para que toda
// leitura/escrita respeite RLS como o próprio usuário dono da linha.

import { createClient } from "npm:@supabase/supabase-js@2";
import { calculateFitScore, type DiagnosticoParaScore, type NichoParaScore } from "../../../packages/core/fitScore.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"; // RN-10: modelo econômico para justificativa curta

const PREVIEW_SIZE = 3; // RN-7: prévia gratuita sempre mostra 3 nichos

// Rede de segurança contra markdown residual — o card do app renderiza texto
// plano, e o prompt já pede pra IA não usar markdown, mas isso garante que
// nenhum **negrito**, # título ou lista escape para a UI mesmo se o modelo ignorar a instrução.
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

interface NicheRow extends NichoParaScore {
  id: string;
  nome: string;
  slug: string;
  investimento_min: number;
  investimento_max: number;
  fonte: string | null;
  fonte_data: string | null;
}

async function gerarJustificativa(
  diagnostico: DiagnosticoParaScore,
  niche: NicheRow,
  scores: ReturnType<typeof calculateFitScore>
): Promise<string> {
  const system = [
    "Você é o copiloto do Ser Dono, uma plataforma que ajuda brasileiros a decidir qual negócio abrir.",
    "Sua única tarefa aqui é explicar, em 1 a 2 frases curtas e em português simples (sem jargão), por que",
    "um nicho específico combina com o perfil do usuário — a nota de aderência (Fit Score) JÁ FOI CALCULADA",
    "por fórmula, você só explica o resultado, nunca decide ou recalcula a nota.",
    "Use exclusivamente os dados estruturados fornecidos abaixo. Nunca invente número de mercado que não",
    "esteja nos dados fornecidos. Se mencionar investimento ou margem, e houver fonte/data fornecidas, cite-as",
    "no formato 'Fonte, mês/ano' ao final da frase.",
    "Responda em TEXTO PLANO, sem markdown: nunca use **negrito**, # títulos, listas com hífen/asterisco ou",
    "qualquer outra marcação — o texto vai direto num card de app que não interpreta markdown, só texto corrido.",
  ].join(" ");

  const contexto = {
    nicho: niche.nome,
    categoria: niche.categoria,
    faixa_investimento: `R$ ${niche.investimento_min} a R$ ${niche.investimento_max}`,
    margem_tipica_pct: niche.margem_tipica_pct,
    tempo_ate_equilibrio_meses: niche.tempo_ate_equilibrio_meses,
    fonte: niche.fonte,
    fonte_data: niche.fonte_data,
    fit_score: scores.fit_score,
    componentes: {
      perfil: scores.score_perfil,
      financeiro: scores.score_financeiro,
      contexto: scores.score_contexto,
      tempo: scores.score_tempo,
    },
    perfil_usuario: {
      capital_disponivel: diagnostico.capital_disponivel,
      apetite_risco: diagnostico.apetite_risco,
      tempo_disponivel: diagnostico.tempo_disponivel,
    },
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 200,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], // RN-12: cache do prefixo fixo
      messages: [{ role: "user", content: JSON.stringify(contexto) }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  return stripMarkdown(text || "Combina com o seu perfil de acordo com o cálculo do diagnóstico.");
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

    const { data: diagnostico, error: diagError } = await supabase
      .from("diagnostic_responses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (diagError) throw diagError;
    if (!diagnostico || diagnostico.status_preenchimento !== "concluido") {
      return new Response(JSON.stringify({ error: "Diagnóstico não concluído para este usuário" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: niches, error: nichesError } = await supabase
      .from("niches")
      .select("*")
      .eq("ativo_no_mvp", true);

    if (nichesError) throw nichesError;
    if (!niches || niches.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum nicho ativo cadastrado" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const diagnosticoParaScore: DiagnosticoParaScore = {
      capital_disponivel: diagnostico.capital_disponivel,
      meses_de_folego: diagnostico.meses_de_folego,
      apetite_risco: diagnostico.apetite_risco,
      tempo_disponivel: diagnostico.tempo_disponivel,
      formacao: diagnostico.formacao ?? [],
      experiencia: diagnostico.experiencia ?? [],
    };

    const scored = (niches as NicheRow[])
      .map((niche) => ({ niche, scores: calculateFitScore(diagnosticoParaScore, niche) }))
      .sort((a, b) => b.scores.fit_score - a.scores.fit_score);

    const top = scored.slice(0, PREVIEW_SIZE);

    const results = await Promise.all(
      top.map(async ({ niche, scores }) => {
        const justificativa_ia = await gerarJustificativa(diagnosticoParaScore, niche, scores);

        const { error: upsertError } = await supabase.from("niche_matches").upsert(
          {
            user_id: user.id,
            niche_id: niche.id,
            fit_score: scores.fit_score,
            score_perfil: scores.score_perfil,
            score_financeiro: scores.score_financeiro,
            score_contexto: scores.score_contexto,
            score_tempo: scores.score_tempo,
            justificativa_ia,
            gerado_em: new Date().toISOString(),
          },
          { onConflict: "user_id,niche_id" }
        );
        if (upsertError) throw upsertError;

        return {
          niche_id: niche.id,
          nome: niche.nome,
          slug: niche.slug,
          investimento_min: niche.investimento_min,
          investimento_max: niche.investimento_max,
          ...scores,
          justificativa_ia,
        };
      })
    );

    return new Response(JSON.stringify({ matches: results }), {
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
