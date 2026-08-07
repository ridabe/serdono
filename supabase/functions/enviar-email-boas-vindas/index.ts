// Ser Dono — Edge Function "enviar-email-boas-vindas" (SDD-70, SDD-71, SDD-72).
//
// CONTEXTO: a confirmação de e-mail do Supabase Auth foi desligada porque
// confundia o usuário (ele criava a conta e ficava esperando um passo que não
// entendia). Sem ela, ninguém mais recebia nada depois do cadastro — este
// e-mail ocupa esse lugar: confirma que a conta existe, diz como voltar e
// mostra o que já dá pra usar.
//
// DECISÕES QUE ESTA FUNÇÃO IMPÕE:
//
// 1. A SENHA NUNCA É ENVIADA (SDD-71). O Supabase guarda hash irreversível —
//    para colocá-la no e-mail seria preciso capturar o texto puro no client e
//    trafegá-lo até aqui, deixando a credencial em texto aberto na caixa de
//    entrada para sempre. O e-mail mostra o endereço de acesso e aponta para
//    "Esqueci minha senha". Esta função sequer aceita um campo de senha no
//    corpo da requisição — se um dia alguém tentar mandar, é ignorado.
//
// 2. Os módulos listados vêm do BANCO, não de uma lista fixa aqui. Módulo novo
//    entra em `public.modules` com `ativo = true` e passa a aparecer no e-mail
//    sozinho, sem alterar código (o mesmo princípio de rotas.ts, SDD-54).
//
// 3. O envio é IDEMPOTENTE por usuário: `users.welcome_email_enviado_em`. Um
//    retry do client (ou dois cliques) não gera dois e-mails.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  assuntoBoasVindas,
  htmlBoasVindas,
  textoBoasVindas,
  type Modulo,
} from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

// Remetente precisa estar num domínio verificado no Resend, senão a entrega falha.
const FROM = Deno.env.get("EMAIL_FROM") ?? "Mary do Ser Dono <mary@serdono.com.br>";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? "contato@serdono.com.br";
const BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? "https://serdono.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    // Client como o próprio usuário: descobre QUEM está chamando sem confiar
    // num id vindo do corpo da requisição (impede disparar e-mail para outro).
    const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: auth, error: authError } = await asUser.auth.getUser();
    if (authError || !auth?.user) return json({ error: "Sessão inválida." }, 401);

    const user = auth.user;
    if (!user.email) {
      // Sessão anônima que ainda não virou conta — nada a enviar.
      return json({ enviado: false, motivo: "sem_email" });
    }

    // Service role: precisa ler/gravar a marca de idempotência mesmo que a RLS
    // do usuário não exponha a coluna, e ler o catálogo de módulos.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: perfil, error: perfilError } = await admin
      .from("users")
      .select("nome, welcome_email_enviado_em")
      .eq("id", user.id)
      .single();
    if (perfilError) throw perfilError;

    if (perfil?.welcome_email_enviado_em) {
      return json({ enviado: false, motivo: "ja_enviado" });
    }

    const { data: modulosDb, error: modulosError } = await admin
      .from("modules")
      .select("nome, descricao")
      .eq("ativo", true)
      .order("ordem", { ascending: true });
    if (modulosError) throw modulosError;

    const modulos: Modulo[] = (modulosDb ?? []).map((m) => ({
      nome: m.nome as string,
      descricao: m.descricao as string,
    }));

    const dados = {
      nome: (perfil?.nome as string) ?? "",
      email: user.email,
      baseUrl: BASE_URL,
      modulos,
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        reply_to: REPLY_TO,
        subject: assuntoBoasVindas(dados.nome),
        html: htmlBoasVindas(dados),
        text: textoBoasVindas(dados),
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error("Resend falhou", resp.status, detalhe);
      // Não marca como enviado — permite nova tentativa depois.
      return json({ enviado: false, motivo: "falha_provedor" }, 502);
    }

    await admin
      .from("users")
      .update({ welcome_email_enviado_em: new Date().toISOString() })
      .eq("id", user.id);

    return json({ enviado: true });
  } catch (e) {
    console.error("enviar-email-boas-vindas", e);
    return json({ error: (e as Error).message }, 500);
  }
});
