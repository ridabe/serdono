// Ser Dono — Edge Function "jornada-gerar-nomes" (Jornada Empreendedora,
// Fase 3: Planejamento, Etapa 1 — Nome da Empresa, SDD-34).
//
// A partir de palavras-chave do usuário, gera 10 nomes candidatos com IA e,
// para cada um, consulta disponibilidade de domínio (.com.br via RDAP do
// Registro.br, .com via RDAP da Verisign) e um indício simples de handle do
// Instagram. Por decisão de produto (ver SDD-34), NÃO consulta disponibilidade
// de nome empresarial (Junta Comercial) nem marca (INPI) — nenhuma das duas
// tem API pública/oficial; essas duas etapas do fluxo original foram
// descartadas do MVP.
//
// Mesmo padrão de auth de jornada-gerar-documentos: repassa o Authorization
// do chamador, sem service_role.

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

interface CandidatoNome {
  nome: string;
  slug: string;
  dominio_com_br: { disponivel: boolean | null };
  dominio_com: { disponivel: boolean | null };
  instagram: { disponivel: boolean | null };
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos após decompor (NFD)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

// deno-lint-ignore no-explicit-any
async function gerarNomes(contexto: Record<string, unknown>, supabase: any, userId: string): Promise<string[]> {
  const system = [
    "Você é o copiloto do Ser Dono, ajudando um empreendedor brasileiro a escolher o nome da empresa,",
    "na Fase 3 (Planejamento) da Jornada Empreendedora.",
    "Gere exatamente 10 nomes de empresa em português, curtos (1-3 palavras), fáceis de lembrar e de",
    "pronunciar, coerentes com o nicho e as palavras-chave fornecidas. Evite nomes genéricos demais",
    "ou que já sejam marcas conhecidas. Não repita as palavras-chave literalmente em todos os nomes.",
    "Responda EXCLUSIVAMENTE com um array JSON de 10 strings, sem markdown, sem texto antes ou depois:",
    '["Nome 1","Nome 2",...,"Nome 10"]',
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
      max_tokens: 500,
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
    funcao: "jornada-gerar-nomes",
    provider: "anthropic",
    modelo: AI_MODEL_AVANCADO,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  });
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo");

  try {
    const nomes = extractJson(text) as string[];
    if (!Array.isArray(nomes) || nomes.length === 0) throw new Error("formato inesperado");
    return nomes.slice(0, 10);
  } catch {
    throw new Error("Não foi possível interpretar os nomes gerados — tente novamente");
  }
}

// Checagem best-effort — em caso de timeout/erro/resposta ambígua retorna
// `null` (desconhecido), nunca inventa um resultado.
async function checarDominio(slug: string, tld: "com.br" | "com"): Promise<boolean | null> {
  const url =
    tld === "com.br"
      ? `https://rdap.registro.br/domain/${slug}.com.br`
      : `https://rdap.verisign.com/com/v1/domain/${slug}.com`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; SerDonoBot/1.0)", accept: "application/rdap+json" },
    });
    if (res.status === 404) return true; // não registrado -> disponível
    if (res.status !== 200) return null;
    // Um 200 só significa "registrado" se o corpo for mesmo um objeto RDAP de
    // domínio — provedores de RDAP às vezes devolvem 200 com página de erro
    // genérica pra egress de nuvem (bloqueio silencioso); nesse caso não dá
    // pra confiar no resultado, então cai em "não verificado" em vez de
    // inventar "indisponível".
    try {
      const body = await res.json();
      if (body?.objectClassName === "domain" && typeof body?.ldhName === "string") return false;
      return null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function checarInstagram(slug: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${slug}/`, {
      signal: AbortSignal.timeout(5000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; SerDonoBot/1.0)" },
    });
    if (res.status === 404) return true;
    if (res.status !== 200) return null;
    const html = await res.text();
    // Página de perfil inexistente do Instagram renderiza esse título mesmo com status 200.
    if (/Page Not Found|Sorry, this page isn't available/i.test(html)) return true;
    return false;
  } catch {
    return null;
  }
}

async function montarCandidato(nome: string): Promise<CandidatoNome> {
  const slug = slugify(nome);
  const [comBr, com, instagram] = await Promise.all([
    checarDominio(slug, "com.br"),
    checarDominio(slug, "com"),
    checarInstagram(slug),
  ]);
  return {
    nome,
    slug,
    dominio_com_br: { disponivel: comBr },
    dominio_com: { disponivel: com },
    instagram: { disponivel: instagram },
  };
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

    const { jornada_instance_id, palavras_chave } = await req.json();
    if (!jornada_instance_id || !Array.isArray(palavras_chave) || palavras_chave.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campos 'jornada_instance_id' e 'palavras_chave' (array não vazio) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("id", jornada_instance_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance) {
      return new Response(JSON.stringify({ error: "Jornada não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const nomes = await gerarNomes({ nicho: instance.niches, palavras_chave }, supabase, user.id);
    const candidatos = await Promise.all(nomes.map(montarCandidato));

    const { data: existente } = await supabase
      .from("jornada_deliverables")
      .select("versao")
      .eq("jornada_instance_id", jornada_instance_id)
      .eq("tipo", "nomes_empresa")
      .maybeSingle();

    const { error: upsertError } = await supabase.from("jornada_deliverables").upsert(
      {
        jornada_instance_id,
        tipo: "nomes_empresa",
        conteudo: { palavras_chave, candidatos },
        gerado_por: "ia",
        versao: (existente?.versao ?? 0) + 1,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "jornada_instance_id,tipo" }
    );
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ candidatos }), {
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
