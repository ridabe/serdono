// Ser Dono — Edge Function "diagnostic-match" (PRD §7-8, SPEC §5, SDD-66).
//
// Roda depois que o usuário conclui o questionário do diagnóstico:
// 1. (NOVO, SDD-66) Se a pessoa respondeu a pergunta aberta do bloco 6,
//    classifica esse texto num VOCABULÁRIO FECHADO de áreas — a IA amplia o
//    sinal de perfil que os checkboxes não capturam, e o resultado é
//    persistido pra ser auditável (RN-37).
// 2. Calcula o Fit Score dos nichos ativos — fórmula determinística de
//    packages/core/fitScore.ts, a MESMA usada no restante do produto
//    (SDD-3: lógica de negócio única, nunca duplicada).
// 3. Chama Claude (Haiku — RN-10, baixa complexidade) para escrever a
//    justificativa dos 3 melhores nichos (RN-7) E escolher, DENTRE O
//    CATÁLOGO CURADO de sub-negócios daquele nicho, os que mais combinam com
//    o perfil — a nota em si nunca é decidida pela IA, e nenhum tipo de
//    negócio é inventado (RN-38).
// 4. Grava tudo em niche_matches e devolve a prévia para o client.
//
// A chamada nunca acontece direto do client (protege ANTHROPIC_API_KEY,
// SPEC §5) — o client só invoca esta função autenticado com o próprio JWT
// (sessão anônima ou real), que a função repassa ao Supabase para que toda
// leitura/escrita respeite RLS como o próprio usuário dono da linha.

import { createClient } from "npm:@supabase/supabase-js@2";
import { calculateFitScore, type DiagnosticoParaScore, type NichoParaScore } from "../../../packages/core/fitScore.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logIaUsage } from "../_shared/ia-usage.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"; // RN-10: modelo econômico para classificação e justificativa curta

const PREVIEW_SIZE = 3; // RN-7: prévia gratuita sempre mostra 3 nichos
const MAX_SUB_NEGOCIOS_DESTAQUE = 3; // quantos caminhos concretos mostrar por nicho

/**
 * Vocabulário fechado de áreas — espelha `AREAS_DIAGNOSTICO` em
 * `apps/app/components/diagnostico/blocks.ts` e os valores de
 * `niches.areas_afinidade`. Duplicado aqui de propósito: Edge Function do
 * projeto não importa do monorepo além de `packages/core` (o deploy empacota
 * por valor), e este é o contrato que impede a IA de devolver uma área que
 * nenhum nicho tem.
 */
const AREAS_VALIDAS = ["serviços", "alimentação", "beleza", "varejo", "tecnologia", "educação", "saúde", "moda"];

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
  margem_tipica_pct: number | null;
  dependencia_ponto_fisico: boolean;
  permite_inicio_em_casa: boolean;
  fonte: string | null;
  fonte_data: string | null;
}

interface SubNegocioRow {
  id: string;
  niche_id: string;
  nome: string;
  descricao: string;
  exige_equipe: boolean;
  ordem: number;
}

interface SubNegocioDestaque {
  nome: string;
  por_que: string;
}

// deno-lint-ignore no-explicit-any
async function callAnthropic(
  system: string,
  userContent: string,
  maxTokens: number,
  supabase: any,
  userId: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], // RN-12: cache do prefixo fixo
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  await logIaUsage(supabase, {
    userId,
    funcao: "diagnostic-match",
    provider: "anthropic",
    modelo: ANTHROPIC_MODEL,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  return data.content?.[0]?.text?.trim() ?? "";
}

/** Extrai o primeiro objeto JSON de uma resposta que pode vir cercada de texto/cerca de código. */
function parseJsonResposta<T>(texto: string): T | null {
  const semCerca = texto.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const inicio = semCerca.indexOf("{");
  const fim = semCerca.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) return null;
  try {
    return JSON.parse(semCerca.slice(inicio, fim + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Traduz o texto livre do bloco 6 em áreas do vocabulário fechado (RN-37).
 *
 * É AQUI que a IA supera a fórmula: ela lê "sempre mexi com computador,
 * montei uns sites pra amigos" e entende "tecnologia" — coisa que nenhum
 * checkbox captura. Mas o resultado é filtrado contra `AREAS_VALIDAS`: mesmo
 * que o modelo invente uma categoria, ela é descartada antes de influenciar
 * qualquer nota.
 */
// deno-lint-ignore no-explicit-any
async function inferirAreasDoTexto(texto: string, supabase: any, userId: string): Promise<string[]> {
  const system = [
    "Você classifica o texto de alguém que quer abrir um negócio nas áreas de atuação com as quais essa pessoa tem afinidade.",
    `As ÚNICAS áreas permitidas são exatamente estas: ${AREAS_VALIDAS.join(", ")}.`,
    'Responda SOMENTE um JSON no formato {"areas": ["..."]}, sem nenhum texto antes ou depois.',
    "Inclua no máximo 3 áreas, da mais evidente para a menos evidente.",
    'Se o texto não deixar clara nenhuma afinidade, devolva {"areas": []} — nunca chute.',
    "Nunca invente uma área que não esteja na lista permitida.",
  ].join(" ");

  const bruto = await callAnthropic(system, JSON.stringify({ texto }), 150, supabase, userId);
  const parsed = parseJsonResposta<{ areas?: unknown }>(bruto);
  if (!parsed || !Array.isArray(parsed.areas)) return [];

  // Filtro final: só passa o que existe de fato no vocabulário fechado.
  return parsed.areas
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.toLowerCase().trim())
    .filter((a) => AREAS_VALIDAS.includes(a))
    .slice(0, 3);
}

const MAX_NICHOS_INFERIDOS = 3;

/**
 * Traduz o texto livre do bloco 6 em SLUGS de nicho do catálogo (SDD-135).
 *
 * A área sozinha é grossa demais: "gosto de cortar cabelo e fazer barba" e
 * "faço limpeza de pele" caem os dois em `beleza`, e o motor não separava um
 * barbeiro de uma esteticista. Aqui a IA aponta o ramo pelo nome — e pensa
 * como quem abre micro/pequeno negócio: se a pessoa descreve uma habilidade
 * que dá pra tocar de casa, prefere a versão "a domicílio" / "em casa" / "por
 * encomenda" quando ela existe no catálogo.
 *
 * Mesma disciplina da RN-38: a saída é filtrada contra os slugs reais — o que
 * o modelo inventar morre antes de tocar em qualquer nota. A nota segue
 * calculada por fórmula; isto só amplia o sinal de entrada.
 */
// deno-lint-ignore no-explicit-any
async function inferirNichosDoTexto(
  texto: string,
  catalogo: { slug: string; nome: string; categoria: string; permite_inicio_em_casa: boolean }[],
  supabase: any,
  userId: string
): Promise<string[]> {
  const system = [
    "Você lê o texto de alguém que quer abrir um negócio e aponta, no catálogo fornecido, os ramos que a pessoa CLARAMENTE demonstra querer ou já saber fazer.",
    "O público é micro e pequeno empreendedor, que quase sempre começa pequeno e muitas vezes de casa.",
    "Se a pessoa descreve uma habilidade que dá pra tocar de casa ou atendendo na casa do cliente, e existe no catálogo uma versão 'a domicílio' / 'em casa' / 'por encomenda' / 'freelancer', prefira essa — e cite também a versão formal se ela existir.",
    "Responda SOMENTE um JSON no formato {\"slugs\": [\"...\"]}, sem texto antes ou depois.",
    `No máximo ${MAX_NICHOS_INFERIDOS} slugs, do mais evidente para o menos evidente.`,
    "Use EXCLUSIVAMENTE os valores do campo 'slug' do catálogo. Nunca invente um slug.",
    'Se o texto não apontar nenhum ramo com clareza, devolva {"slugs": []} — não chute por associação vaga.',
  ].join(" ");

  const userContent = JSON.stringify({
    texto,
    catalogo: catalogo.map((n) => ({ slug: n.slug, nome: n.nome, categoria: n.categoria, comeca_de_casa: n.permite_inicio_em_casa })),
  });

  const bruto = await callAnthropic(system, userContent, 200, supabase, userId);
  const parsed = parseJsonResposta<{ slugs?: unknown }>(bruto);
  if (!parsed || !Array.isArray(parsed.slugs)) return [];

  const slugsValidos = new Set(catalogo.map((n) => n.slug));
  return parsed.slugs
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toLowerCase().trim())
    .filter((s) => slugsValidos.has(s))
    .slice(0, MAX_NICHOS_INFERIDOS);
}

interface JustificativaResultado {
  justificativa: string;
  sub_negocios_destaque: SubNegocioDestaque[];
}

/**
 * Escreve a justificativa do nicho e escolhe os sub-negócios que mais
 * combinam com o perfil — sempre a partir da lista curada recebida (RN-38).
 */
// deno-lint-ignore no-explicit-any
async function gerarJustificativaESubNegocios(
  diagnostico: DiagnosticoParaScore,
  niche: NicheRow,
  scores: ReturnType<typeof calculateFitScore>,
  subNegocios: SubNegocioRow[],
  supabase: any,
  userId: string
): Promise<JustificativaResultado> {
  const system = [
    "Você é o copiloto do Ser Dono, uma plataforma que ajuda brasileiros de micro e pequeno negócio a decidir qual negócio abrir.",
    "Pense como quem começa pequeno: a maioria vai abrir com pouco capital, muitas vezes de casa ou atendendo na casa do cliente, antes de pensar em ponto de rua.",
    "A nota de aderência (Fit Score) JÁ FOI CALCULADA por fórmula — você só explica o resultado, nunca decide ou recalcula a nota.",
    "Sua resposta tem duas partes:",
    "1) 'justificativa': 1 a 2 frases curtas, em português simples e sem jargão, dizendo por que este nicho combina com o perfil.",
    "Se 'nicho.comeca_de_casa' for true, deixe explícito que dá pra começar de casa ou na casa do cliente, sem alugar ponto.",
    "Se 'precisa_de_mais_capital' for true, diga com honestidade que o capital informado é apertado pra esse ramo e que vale planejar um pouco mais de caixa — sem desanimar.",
    `2) 'sub_negocios_destaque': até ${MAX_SUB_NEGOCIOS_DESTAQUE} negócios concretos, ESCOLHIDOS EXCLUSIVAMENTE da lista 'sub_negocios_disponiveis' que você recebe.`,
    "REGRA ABSOLUTA: nunca sugira um negócio que não esteja nessa lista, e copie o campo 'nome' exatamente como recebido.",
    "Para cada um, escreva 'por_que': uma frase curta ligando aquele caminho ao perfil da pessoa (capital, tempo disponível, apetite a risco ou área de afinidade).",
    "Use exclusivamente os dados estruturados fornecidos. Nunca invente número de mercado que não esteja nos dados.",
    "NUNCA afirme que a pessoa tem afinidade, experiência ou gosto por uma área que não esteja em 'perfil_usuario.areas_de_afinidade'.",
    "Atenção: 'areas_afinidade' descreve o NICHO, não a pessoa — dizer 'sua afinidade com moda' para quem nunca declarou moda é invenção sobre a vida de alguém.",
    "Se mencionar investimento ou margem, e houver fonte/data fornecidas, cite-as no formato 'Fonte, mês/ano' ao final da frase.",
    'Responda SOMENTE um JSON no formato {"justificativa": "...", "sub_negocios_destaque": [{"nome": "...", "por_que": "..."}]}.',
    "Nada de markdown: sem **negrito**, sem # títulos, sem listas com hífen — o texto vai direto num card de app que não interpreta markdown.",
  ].join(" ");

  const contexto = {
    nicho: {
      nome: niche.nome,
      categoria: niche.categoria,
      comeca_de_casa: niche.permite_inicio_em_casa || niche.dependencia_ponto_fisico === false,
    },
    categoria: niche.categoria,
    areas_afinidade: niche.areas_afinidade,
    faixa_investimento: `R$ ${niche.investimento_min} a R$ ${niche.investimento_max}`,
    margem_tipica_pct: niche.margem_tipica_pct,
    tempo_ate_equilibrio_meses: niche.tempo_ate_equilibrio_meses,
    fonte: niche.fonte,
    fonte_data: niche.fonte_data,
    fit_score: scores.fit_score,
    precisa_de_mais_capital: scores.precisa_de_mais_capital,
    citado_no_texto_livre: scores.afinidade_direta,
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
      // Tudo que a pessoa de fato declarou (checkbox + experiência + o que a
      // IA inferiu do texto livre) — é o único conjunto que a justificativa
      // pode chamar de "afinidade sua".
      areas_de_afinidade: [
        ...diagnostico.formacao,
        ...diagnostico.experiencia,
        ...(diagnostico.areas_inferidas ?? []),
      ],
    },
    sub_negocios_disponiveis: subNegocios.map((s) => ({
      nome: s.nome,
      descricao: s.descricao,
      exige_equipe: s.exige_equipe,
    })),
  };

  const bruto = await callAnthropic(system, JSON.stringify(contexto), 700, supabase, userId);
  const parsed = parseJsonResposta<{ justificativa?: unknown; sub_negocios_destaque?: unknown }>(bruto);

  const justificativa = stripMarkdown(
    typeof parsed?.justificativa === "string" && parsed.justificativa.trim()
      ? parsed.justificativa
      : "Combina com o seu perfil de acordo com o cálculo do diagnóstico."
  );

  // RN-38 na prática: mesmo que o modelo invente um nome, ele é descartado
  // aqui — só sobrevive o que existe de fato no catálogo curado.
  const nomesValidos = new Map(subNegocios.map((s) => [s.nome.toLowerCase().trim(), s.nome]));
  const destaques: SubNegocioDestaque[] = Array.isArray(parsed?.sub_negocios_destaque)
    ? (parsed.sub_negocios_destaque as unknown[])
        .flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const { nome, por_que } = item as { nome?: unknown; por_que?: unknown };
          if (typeof nome !== "string") return [];
          const nomeReal = nomesValidos.get(nome.toLowerCase().trim());
          if (!nomeReal) return [];
          return [{ nome: nomeReal, por_que: stripMarkdown(typeof por_que === "string" ? por_que : "") }];
        })
        .slice(0, MAX_SUB_NEGOCIOS_DESTAQUE)
    : [];

  // Se a IA falhou em escolher, cai nos primeiros do catálogo (ordem curada) —
  // o usuário nunca fica sem os caminhos concretos, que é o ponto do módulo.
  const fallback = subNegocios
    .slice(0, MAX_SUB_NEGOCIOS_DESTAQUE)
    .map((s) => ({ nome: s.nome, por_que: s.descricao }));

  return { justificativa, sub_negocios_destaque: destaques.length > 0 ? destaques : fallback };
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

    const { data: niches, error: nichesError } = await supabase.from("niches").select("*").eq("ativo_no_mvp", true);

    if (nichesError) throw nichesError;
    if (!niches || niches.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum nicho ativo cadastrado" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ---- Passo 1: texto livre → áreas + nichos (RN-37, SDD-135) ----
    // Best-effort: se a IA falhar, o diagnóstico segue com o sinal dos
    // checkboxes, exatamente como antes desta feature (mesmo padrão de
    // degradação graciosa de `loadBusinessContext` na knowledge-search).
    let areasInferidas: string[] = diagnostico.areas_inferidas ?? [];
    let nichosInferidos: string[] = diagnostico.nichos_inferidos ?? [];
    if (diagnostico.interesses_texto?.trim()) {
      const texto = diagnostico.interesses_texto;
      const catalogo = (niches as NicheRow[]).map((n) => ({
        slug: n.slug,
        nome: n.nome,
        categoria: n.categoria,
        permite_inicio_em_casa: n.permite_inicio_em_casa,
      }));
      try {
        [areasInferidas, nichosInferidos] = await Promise.all([
          inferirAreasDoTexto(texto, supabase, user.id),
          inferirNichosDoTexto(texto, catalogo, supabase, user.id),
        ]);
        const { error: updErr } = await supabase
          .from("diagnostic_responses")
          .update({ areas_inferidas: areasInferidas, nichos_inferidos: nichosInferidos })
          .eq("user_id", user.id);
        if (updErr) throw updErr;
      } catch (e) {
        console.error("Falha ao interpretar o texto livre (seguindo sem ele):", e);
        areasInferidas = [];
        nichosInferidos = [];
      }
    }

    const diagnosticoParaScore: DiagnosticoParaScore = {
      capital_disponivel: diagnostico.capital_disponivel,
      meses_de_folego: diagnostico.meses_de_folego,
      apetite_risco: diagnostico.apetite_risco,
      tempo_disponivel: diagnostico.tempo_disponivel,
      formacao: diagnostico.formacao ?? [],
      experiencia: diagnostico.experiencia ?? [],
      areas_inferidas: areasInferidas,
      nichos_inferidos: nichosInferidos,
    };

    // ---- Passo 2: nota determinística ----
    // Ordena por fit_score, mas um ramo que a pessoa CITOU no texto livre e que
    // tem nota mínima razoável vem primeiro — não deixa um pedido explícito
    // ficar fora dos 3 melhores por causa de concorrência ou intensidade de
    // trabalho (SDD-135). O `+1000` é só chave de ordenação, não entra na nota.
    const AFINIDADE_DIRETA_FIT_MINIMO = 40;
    const chaveOrdem = (s: ReturnType<typeof calculateFitScore>) =>
      s.fit_score + (s.afinidade_direta && s.fit_score >= AFINIDADE_DIRETA_FIT_MINIMO ? 1000 : 0);
    const scored = (niches as NicheRow[])
      .map((niche) => ({ niche, scores: calculateFitScore(diagnosticoParaScore, niche) }))
      .sort((a, b) => chaveOrdem(b.scores) - chaveOrdem(a.scores));

    const top = scored.slice(0, PREVIEW_SIZE);

    // ---- Passo 3: catálogo curado de sub-negócios só dos 3 escolhidos ----
    const { data: subNegocios, error: subError } = await supabase
      .from("niche_sub_negocios")
      .select("id, niche_id, nome, descricao, exige_equipe, ordem")
      .in(
        "niche_id",
        top.map(({ niche }) => niche.id)
      )
      .eq("ativo", true)
      .order("ordem");
    if (subError) throw subError;

    const subPorNicho = new Map<string, SubNegocioRow[]>();
    for (const s of (subNegocios ?? []) as SubNegocioRow[]) {
      const lista = subPorNicho.get(s.niche_id) ?? [];
      lista.push(s);
      subPorNicho.set(s.niche_id, lista);
    }

    const results = await Promise.all(
      top.map(async ({ niche, scores }) => {
        const { justificativa, sub_negocios_destaque } = await gerarJustificativaESubNegocios(
          diagnosticoParaScore,
          niche,
          scores,
          subPorNicho.get(niche.id) ?? [],
          supabase,
          user.id
        );

        const { error: upsertError } = await supabase.from("niche_matches").upsert(
          {
            user_id: user.id,
            niche_id: niche.id,
            fit_score: scores.fit_score,
            score_perfil: scores.score_perfil,
            score_financeiro: scores.score_financeiro,
            score_contexto: scores.score_contexto,
            score_tempo: scores.score_tempo,
            precisa_de_mais_capital: scores.precisa_de_mais_capital,
            afinidade_direta: scores.afinidade_direta,
            justificativa_ia: justificativa,
            sub_negocios_destaque,
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
          justificativa_ia: justificativa,
          sub_negocios_destaque,
        };
      })
    );

    return new Response(
      JSON.stringify({ matches: results, areas_inferidas: areasInferidas, nichos_inferidos: nichosInferidos }),
      { headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
