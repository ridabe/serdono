// Ser Dono — Edge Function "retencao-gerar-roteiro" (Módulo Retenção de
// Clientes, SDD-54, PRD §12.5).
//
// Gera o roteiro de reaproximação de UM cliente específico: o que dizer pra
// alguém que comprou e sumiu, com o contexto do negócio de quem está falando.
//
// Modelo avançado (RN-10: é texto que o empreendedor vai mandar pra um
// cliente real, com o nome dele — não é classificação interna). Regenerável
// quantas vezes ele quiser (RN-26), upsert incrementando `versao`.
//
// O que a function NUNCA faz, e por quê (mesma disciplina de
// jornada-gerar-oferta/SDD-45 e do roteiro de Fornecedores/SDD-41): não
// inventa desconto, preço, promoção, nem um fato sobre o relacionamento que
// não esteja no histórico enviado. O empreendedor vai mandar isso pra uma
// pessoa que sabe o que aconteceu de verdade — uma frase inventada ("como
// você adorou o último serviço") destrói a confiança na hora.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

const AI_MODEL_AVANCADO = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

interface RoteiroReaproximacao {
  abertura: string;
  motivo: string;
  oferta: string;
  fechamento: string;
  mensagemPronta: string;
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
async function gerarRoteiro(contexto: Record<string, unknown>, supabase: any, userId: string): Promise<RoteiroReaproximacao> {
  const system = [
    "Você é a Mary, mentora de negócios do Ser Dono, ajudando um empreendedor brasileiro a reaproximar um cliente",
    "que comprou dele e faz tempo que não volta. Escreva em português do Brasil, em tom de pessoa falando com pessoa",
    "— nunca linguagem de marketing agressivo, nunca urgência artificial ('última chance', 'só hoje'), nunca soar",
    "como cobrança ou como robô. O empreendedor vai mandar isso por WhatsApp pra alguém que ele conhece.",
    "REGRAS DE VERACIDADE (as mais importantes): use SOMENTE os fatos do contexto. Nunca invente valor de desconto,",
    "preço, promoção, novidade, produto novo ou qualquer detalhe do relacionamento que não esteja no histórico",
    "enviado. Se o histórico for pobre, escreva algo mais simples — nunca preencha com fato inventado. Não afirme",
    "o que o cliente sentiu ou achou da compra anterior; isso não está no contexto.",
    "Devolva: abertura (como iniciar a conversa), motivo (a razão honesta do contato agora), oferta (o convite,",
    "genérico o suficiente pro empreendedor completar com a condição real dele — nunca um número que não veio no",
    "contexto), fechamento (como encerrar deixando a porta aberta, sem pressionar) e mensagemPronta (os quatro",
    "juntos como uma única mensagem de WhatsApp, curta, no máximo 4 linhas, pronta pra copiar e enviar).",
    "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"abertura":string,"motivo":string,"oferta":string,"fechamento":string,"mensagemPronta":string}',
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
  await logIaUsage(supabase, {
    userId,
    funcao: "retencao-gerar-roteiro",
    provider: "anthropic",
    modelo: AI_MODEL_AVANCADO,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  try {
    return extractJson(text) as RoteiroReaproximacao;
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

    const { cliente_id } = (await req.json()) as { cliente_id?: string };
    if (!cliente_id) {
      return new Response(JSON.stringify({ error: "Campo 'cliente_id' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // A RLS já limitaria o SELECT ao dono, mas o filtro explícito por user_id
    // deixa o 404 correto (em vez de um erro genérico) quando o id não é dele.
    const { data: cliente, error: clienteError } = await supabase
      .from("retencao_clientes")
      .select("*")
      .eq("id", cliente_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (clienteError) throw clienteError;
    if (!cliente) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado na sua carteira" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: interacoes } = await supabase
      .from("retencao_interacoes")
      .select("tipo, valor, ocorrida_em, notas")
      .eq("cliente_id", cliente_id)
      .order("ocorrida_em", { ascending: false })
      .limit(10);

    // Contexto do negócio (best-effort, mesmo espírito de `loadBusinessContext`
    // do knowledge-search/SDD-50): quem não fez a Jornada não tem essa linha, e
    // o roteiro sai mesmo assim — só mais genérico, nunca inventado.
    const { data: jornada } = await supabase
      .from("jornada_instances")
      .select("nome_empresa_escolhido, slogan_escolhido, nicho_personalizado, niches(nome, categoria)")
      .eq("user_id", user.id)
      .maybeSingle();

    const contexto = {
      negocio: {
        nome_empresa: jornada?.nome_empresa_escolhido ?? null,
        slogan: jornada?.slogan_escolhido ?? null,
        nicho: jornada?.niches ?? jornada?.nicho_personalizado ?? null,
      },
      cliente: {
        nome: cliente.nome,
        empresa: cliente.empresa,
        notas: cliente.notas,
      },
      historico: interacoes ?? [],
    };

    const roteiro = await gerarRoteiro(contexto, supabase, user.id);

    const { data: existente } = await supabase
      .from("retencao_roteiros")
      .select("versao")
      .eq("cliente_id", cliente_id)
      .maybeSingle();

    const { error: upsertError } = await supabase.from("retencao_roteiros").upsert(
      { cliente_id, conteudo: roteiro, versao: (existente?.versao ?? 0) + 1 },
      { onConflict: "cliente_id" }
    );
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify(roteiro), {
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
