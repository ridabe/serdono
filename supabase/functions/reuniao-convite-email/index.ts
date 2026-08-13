// Ser Dono — Edge Function "reuniao-convite-email" (Assistente de Reunião,
// convite por e-mail, 13/08/2026). Item que o PRD §12.15 listava como
// "fora de escopo desta versão" e passa a ser construído agora, a pedido
// explícito do dono do produto.
//
// Envia um e-mail de convite pro contato de uma reunião já agendada
// (`reunioes_agenda.contato_email`), lendo o logo do negócio quando existir
// (`jornada_instances.logo_path`, bucket privado). Diferente de
// enviar-email-boas-vindas (SDD-70): NÃO é idempotente por natureza — o
// usuário decide reenviar (ex.: depois de reagendar), e `salvarAgendamento`
// já zera `convite_enviado_em` a cada upsert pra refletir isso.
//
// SEM service role: tudo passa pelo client autenticado como o próprio
// usuário — RLS de `reunioes`/`reunioes_agenda`/`jornada_instances` (todas
// "own row") já garante que só é possível enviar convite da própria
// reunião, sem precisar de checagem extra de posse.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { assuntoConvite, htmlConvite, textoConvite, type DadosConviteReuniao } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const FROM = Deno.env.get("EMAIL_FROM") ?? "Mary do Ser Dono <mary@serdono.com.br>";
const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

// 7 dias: o e-mail pode ser aberto bem depois de enviado (o convidado não é
// usuário do produto, não há como saber quando vai ler) — bem mais longo que
// o 1h usado pro próprio dono baixar o logo (`getLogoDownloadUrl`).
const LOGO_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const IDENTIDADE_VISUAL_BUCKET = "identidade-visual";

const LOCAL_TIPO_LABEL: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatarDataHoraReuniao(dataHoraISO: string): string {
  const data = new Date(dataHoraISO);
  const dataFormatada = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
  const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${dataFormatada} às ${horaFormatada}`;
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
    const reuniaoId = body?.reuniao_id;
    if (typeof reuniaoId !== "string" || !reuniaoId) {
      return json({ error: "Campo 'reuniao_id' é obrigatório." }, 400);
    }

    // Só confirma que a reunião existe e pertence ao usuário (RLS) — `tipo`/
    // `com_quem` são rótulo interno de preparação, não vão pro e-mail.
    const { data: reuniao, error: reuniaoError } = await supabase.from("reunioes").select("id").eq("id", reuniaoId).maybeSingle();
    if (reuniaoError) throw reuniaoError;
    if (!reuniao) return json({ error: "Reunião não encontrada." }, 404);

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("reunioes_agenda")
      .select("*")
      .eq("reuniao_id", reuniaoId)
      .maybeSingle();
    if (agendamentoError) throw agendamentoError;
    if (!agendamento) return json({ error: "Essa reunião ainda não tem agendamento — marque data e local antes de convidar." }, 400);
    if (!agendamento.contato_email) return json({ error: "Informe o e-mail do convidado antes de enviar o convite." }, 400);

    const [{ data: perfil, error: perfilError }, { data: instance, error: instanceError }] = await Promise.all([
      supabase.from("users").select("nome").eq("id", user.id).single(),
      supabase.from("jornada_instances").select("nome_empresa_escolhido, nome_negocio, logo_path").eq("user_id", user.id).maybeSingle(),
    ]);
    if (perfilError) throw perfilError;
    if (instanceError) throw instanceError;

    let logoUrl: string | null = null;
    if (instance?.logo_path) {
      const { data: signed, error: signedError } = await supabase.storage
        .from(IDENTIDADE_VISUAL_BUCKET)
        .createSignedUrl(instance.logo_path, LOGO_SIGNED_URL_TTL_SECONDS);
      // Falha ao assinar o logo não deve impedir o convite — só sai sem imagem.
      if (!signedError) logoUrl = signed.signedUrl;
    }

    const dados: DadosConviteReuniao = {
      remetenteNome: (perfil?.nome as string) || "Um empreendedor do Ser Dono",
      nomeNegocio: (instance?.nome_empresa_escolhido as string) || (instance?.nome_negocio as string) || "meu negócio",
      dataHoraFormatada: formatarDataHoraReuniao(agendamento.data_hora as string),
      localTipoLabel: LOCAL_TIPO_LABEL[agendamento.local_tipo as string] ?? (agendamento.local_tipo as string),
      localValor: agendamento.local_valor as string,
      contatoNome: agendamento.contato_nome as string | null,
      logoUrl,
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
        to: [agendamento.contato_email],
        // Resposta vai direto pro dono da reunião, não pro suporte do Ser
        // Dono — quem recebe o convite fala com a pessoa que convidou.
        reply_to: user.email,
        subject: assuntoConvite(dados),
        html: htmlConvite(dados),
        text: textoConvite(dados),
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error("Resend falhou", resp.status, detalhe);
      return json({ error: "Não foi possível enviar o convite agora. Tente de novo em instantes." }, 502);
    }

    const convite_enviado_em = new Date().toISOString();
    const { data: agendamentoAtualizado, error: updateError } = await supabase
      .from("reunioes_agenda")
      .update({ convite_enviado_em })
      .eq("reuniao_id", reuniaoId)
      .select()
      .single();
    if (updateError) throw updateError;

    return json({ agendamento: agendamentoAtualizado });
  } catch (error) {
    console.error("reuniao-convite-email", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
