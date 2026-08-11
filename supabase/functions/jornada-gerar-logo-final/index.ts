// Ser Dono — Edge Function "jornada-gerar-logo-final" (Jornada Empreendedora,
// Fase 3: Planejamento, Etapa 2 — Identidade Visual, SDD-35).
//
// Depois que o usuário escolhe um dos 3 rascunhos (jornada-gerar-identidade),
// esta function regenera o MESMO estilo em qualidade ALTA (o rascunho era
// qualidade baixa, só para escolha — gasto maior só acontece uma vez, na
// escolha final) e salva no Storage privado do usuário
// (bucket "identidade-visual", path "{user_id}/logo.png").
//
// Limitação conhecida (documentada em SPEC.md SDD-35): a API de imagem não
// tem "upscale" de uma geração anterior — a regeneração usa o mesmo prompt
// e estilo, mas o resultado não é pixel-idêntico ao rascunho mostrado.
//
// Mesmo padrão de auth das demais functions da Jornada: repassa o
// Authorization do chamador, sem service_role — RLS do bucket já garante
// que só a dona do arquivo grava no próprio caminho.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIaUsage } from "../_shared/ia-usage.ts";

const OPENAI_IMAGE_MODEL = "gpt-image-1";
const BUCKET = "identidade-visual";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

type Estilo = "minimalista" | "moderno" | "classico";

interface Respostas {
  valores: string[];
  personalidade: string[];
  tom_comunicacao: string;
  cores_preferidas: string[];
  cores_evitar: string[];
}

function montarPromptLogo(estilo: Estilo, nomeEmpresa: string, nicho: string, respostas: Respostas): string {
  const base =
    `Logotipo profissional para a empresa "${nomeEmpresa}", um negócio de ${nicho}. ` +
    `Valores da marca: ${respostas.valores.join(", ")}. Personalidade: ${respostas.personalidade.join(", ")}. ` +
    `Tom de comunicação: ${respostas.tom_comunicacao}. Cores preferidas: ${respostas.cores_preferidas.join(", ")}. ` +
    (respostas.cores_evitar.length > 0 ? `Evitar as cores: ${respostas.cores_evitar.join(", ")}. ` : "") +
    "Fundo branco liso, logo centralizado, sem texto além do nome da empresa, alta legibilidade em tamanho pequeno.";

  const porEstilo: Record<Estilo, string> = {
    minimalista:
      "Estilo minimalista: formas geométricas simples, poucas cores, bastante espaço negativo, tipografia sans-serif limpa.",
    moderno:
      "Estilo moderno e ousado: formas dinâmicas, contraste forte, tipografia sans-serif com peso, sensação de energia e inovação.",
    classico:
      "Estilo clássico e elegante: composição simétrica, tipografia serifada refinada, sensação de tradição e confiança.",
  };

  return `${base} ${porEstilo[estilo]}`;
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

    const { jornada_instance_id, estilo } = (await req.json()) as {
      jornada_instance_id?: string;
      estilo?: Estilo;
    };
    if (!jornada_instance_id || !estilo) {
      return new Response(JSON.stringify({ error: "Campos 'jornada_instance_id' e 'estilo' são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: instance, error: instanceError } = await supabase
      .from("jornada_instances")
      .select("*, niches(nome, categoria)")
      .eq("id", jornada_instance_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (instanceError) throw instanceError;
    if (!instance || !instance.nome_empresa_escolhido) {
      return new Response(JSON.stringify({ error: "Jornada não encontrada ou nome da empresa ainda não escolhido" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: template } = await supabase
      .from("jornada_etapa_templates")
      .select("id")
      .eq("slug", "planejamento_identidade_visual")
      .single();
    const { data: etapa } = template
      ? await supabase
          .from("jornada_etapas")
          .select("dados_usuario")
          .eq("jornada_instance_id", jornada_instance_id)
          .eq("etapa_template_id", template.id)
          .maybeSingle()
      : { data: null };
    const respostas = etapa?.dados_usuario as Respostas | undefined;
    if (!respostas || !respostas.valores) {
      return new Response(JSON.stringify({ error: "Responda o questionário antes de gerar o logo final" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const nicho = (instance.niches as { nome?: string } | null)?.nome ?? "negócio";
    const prompt = montarPromptLogo(estilo, instance.nome_empresa_escolhido, nicho, respostas);

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: "1024x1024",
        quality: "high",
        n: 1,
      }),
    });
    if (!imageResponse.ok) {
      throw new Error(`OpenAI Images API error (${imageResponse.status}): ${await imageResponse.text()}`);
    }
    const imageData = await imageResponse.json();
    await logIaUsage(supabase, {
      userId: user.id,
      funcao: "jornada-gerar-logo-final",
      provider: "openai",
      modelo: OPENAI_IMAGE_MODEL,
      inputTokens: imageData.usage?.input_tokens ?? null,
      outputTokens: imageData.usage?.output_tokens ?? null,
    });
    const b64 = imageData.data?.[0]?.b64_json;
    if (!b64) throw new Error("Resposta de imagem vazia da OpenAI");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${user.id}/logo.png`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from("jornada_instances")
      .update({ logo_path: path })
      .eq("id", jornada_instance_id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ logo_path: path }), {
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
