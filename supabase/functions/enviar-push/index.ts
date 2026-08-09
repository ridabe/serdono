// Ser Dono — Edge Function "enviar-push" (notificações push, pedido do dono
// do produto em 08/08/2026).
//
// Envio genérico via Expo Push API. Dois jeitos de chamar:
//  1. Usuário autenticado chamando pra SI MESMO (botão "Testar aviso" no
//     Perfil) — Authorization é o JWT do próprio usuário, `user_ids` é
//     ignorado e vira sempre `[caller.id]`.
//  2. `lembretes-diarios` chamando com a service_role key — só nesse caso
//     `user_ids` da requisição é respeitado (lista arbitrária), porque quem
//     está chamando já é um processo interno de confiança, não alguém
//     tentando mandar push pra conta de outro usuário via PostgREST.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}

interface EnviarPushBody {
  user_ids?: string[];
  titulo: string;
  corpo: string;
  dados?: Record<string, unknown>;
}

/** Expo aceita até 100 mensagens por chamada — divide em lotes se precisar (não deve acontecer no volume atual do produto, mas evita quebrar silenciosamente se crescer). */
async function enviarViaExpo(tokens: string[], titulo: string, corpo: string, dados?: Record<string, unknown>): Promise<void> {
  const LOTE = 100;
  for (let i = 0; i < tokens.length; i += LOTE) {
    const lote = tokens.slice(i, i + LOTE);
    const mensagens = lote.map((to) => ({ to, title: titulo, body: corpo, data: dados ?? {}, sound: "default" }));
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(mensagens),
    });
    if (!response.ok) {
      console.error("Expo push API error", response.status, await response.text());
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Faltando header Authorization" }, 401);
    }

    const body = (await req.json()) as EnviarPushBody;
    if (!body.titulo || !body.corpo) {
      return jsonResponse({ error: "Campos 'titulo' e 'corpo' são obrigatórios" }, 400);
    }

    const chamadaInterna = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    let userIds: string[];
    if (chamadaInterna) {
      if (!body.user_ids || body.user_ids.length === 0) {
        return jsonResponse({ error: "Campo 'user_ids' é obrigatório em chamada interna" }, 400);
      }
      userIds = body.user_ids;
    } else {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return jsonResponse({ error: "Sessão inválida" }, 401);
      }
      // Chamada de usuário comum só manda pra si mesmo — nunca confia em
      // `user_ids` do corpo da requisição pra esse caminho.
      userIds = [user.id];
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("user_push_tokens")
      .select("expo_push_token")
      .in("user_id", userIds);
    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return jsonResponse({ enviados: 0 });
    }

    await enviarViaExpo(
      tokens.map((t) => t.expo_push_token),
      body.titulo,
      body.corpo,
      body.dados
    );

    return jsonResponse({ enviados: tokens.length });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
