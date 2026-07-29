// Ser Dono — Edge Function "admin-manage-user" (SDD-30).
//
// Ações administrativas sobre usuários que exigem a Admin API do Supabase
// Auth (convidar, banir/desbanir) ou gravar a coluna `users.role` (grant de
// UPDATE revogado de authenticated/anon desde a SDD-22) — nenhuma das duas
// coisas pode ser feita com a anon key do client, então passam por aqui,
// a única function do projeto que usa a service_role key.
//
// Fluxo: 1) valida a sessão do chamador com a anon key (Authorization
// repassado); 2) decodifica o claim `user_role` do JWT bruto e exige
// "admin" — sem isso, 403; 3) só então usa o client service_role pra
// executar a ação.

import { createClient } from "npm:@supabase/supabase-js@2";

// Inline em vez de importar de ../_shared/cors.ts: o deploy via MCP empacota
// cada function isoladamente e não resolve import relativo fora do próprio
// diretório (diferente do `supabase functions deploy` local via CLI).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Action =
  | { action: "invite"; email: string; nome?: string; role?: "user" | "admin" }
  | { action: "set_role"; user_id: string; role: "user" | "admin" }
  | { action: "set_blocked"; user_id: string; blocked: boolean };

// Mesma lógica de `getUserRole` em packages/supabase/session.ts, mas em Deno
// — aqui dá pra usar `atob` nativo direto, sem o decoder manual que o
// RN/Hermes exige.
function getUserRoleFromJwt(authHeader: string): string {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.user_role === "string" ? json.user_role : "user";
  } catch {
    return "user";
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

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (getUserRoleFromJwt(authHeader) !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem executar essa ação" }), {
        status: 403,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = (await req.json()) as Action;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (body.action === "invite") {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email);
      if (error) throw error;

      if (body.nome || body.role) {
        const update: Record<string, string> = {};
        if (body.nome) update.nome = body.nome;
        if (body.role) update.role = body.role;
        const { error: updateError } = await admin.from("users").update(update).eq("id", data.user.id);
        if (updateError) throw updateError;
      }

      return new Response(JSON.stringify({ user_id: data.user.id }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (body.action === "set_role") {
      const { error } = await admin.from("users").update({ role: body.role }).eq("id", body.user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (body.action === "set_blocked") {
      const { error: authError } = await admin.auth.admin.updateUserById(body.user_id, {
        ban_duration: body.blocked ? "876000h" : "none",
      });
      if (authError) throw authError;

      const { error: dbError } = await admin.from("users").update({ bloqueado: body.blocked }).eq("id", body.user_id);
      if (dbError) throw dbError;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
      status: 400,
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
