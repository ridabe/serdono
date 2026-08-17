// Ser Dono — Edge Function "contrato-enviar-email" (Assistente de
// Contrato, 17/08/2026).
//
// Envia por e-mail o contrato já gerado (`contratos`), com o texto completo
// das cláusulas no corpo em HTML — não um PDF anexado (ver template.ts pro
// motivo). Sempre ação explícita do usuário, nunca automática, sem
// idempotência (RN-63) — reenviar é sempre permitido.
//
// SEM service role: tudo passa pelo client autenticado como o próprio
// usuário — RLS "own row" de `contratos` já garante posse, mesmo padrão de
// reuniao-convite-email.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { gerarClausulas, labelTipoContrato, type TipoContrato } from "./clausulas.ts";
import { assuntoContrato, htmlContrato, textoContrato, type DadosContratoEmail } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const FROM = Deno.env.get("EMAIL_FROM") ?? "Mary do Ser Dono <mary@serdono.com.br>";
const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user) return json({ error: "Sessão inválida." }, 401);
    const user = auth.user;

    const body = await req.json().catch(() => null);
    const contratoId = body?.contrato_id;
    const destinatarioEmail = body?.destinatario_email;
    if (typeof contratoId !== "string" || !contratoId) return json({ error: "Campo 'contrato_id' é obrigatório." }, 400);
    if (typeof destinatarioEmail !== "string" || !emailValido(destinatarioEmail)) {
      return json({ error: "Informe um e-mail válido do destinatário." }, 400);
    }

    // RLS "own row" garante posse — não precisa checar user_id no código.
    const { data: contrato, error: contratoError } = await supabase.from("contratos").select("*").eq("id", contratoId).maybeSingle();
    if (contratoError) throw contratoError;
    if (!contrato) return json({ error: "Contrato não encontrado." }, 404);

    const { data: perfil, error: perfilError } = await supabase.from("users").select("nome").eq("id", user.id).single();
    if (perfilError) throw perfilError;

    const tipo = contrato.tipo as TipoContrato;
    const clausulas = gerarClausulas(tipo, contrato.campos);

    const dados: DadosContratoEmail = {
      remetenteNome: (perfil?.nome as string) || "Um empreendedor do Ser Dono",
      tituloContrato: contrato.titulo as string,
      tipoLabel: labelTipoContrato(tipo),
      clausulas,
      baseUrl: BASE_URL,
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [destinatarioEmail],
        // Resposta vai direto pra quem gerou o contrato, não pro suporte.
        reply_to: user.email,
        subject: assuntoContrato(dados),
        html: htmlContrato(dados),
        text: textoContrato(dados),
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error("Resend falhou", resp.status, detalhe);
      return json({ error: "Não foi possível enviar o contrato agora. Tente de novo em instantes." }, 502);
    }

    const enviado_em = new Date().toISOString();
    const { data: contratoAtualizado, error: updateError } = await supabase
      .from("contratos")
      .update({ enviado_em, enviado_para: destinatarioEmail })
      .eq("id", contratoId)
      .select()
      .single();
    if (updateError) throw updateError;

    return json({ contrato: contratoAtualizado });
  } catch (error) {
    console.error("contrato-enviar-email", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
