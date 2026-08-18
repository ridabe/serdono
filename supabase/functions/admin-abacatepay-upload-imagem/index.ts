// Ser Dono — Edge Function "admin-abacatepay-upload-imagem" (Painel Admin
// AbacatePay, pedido do dono do produto, 18/08/2026).
//
// Sobe a capa de produto direto com service_role, contornando um erro de RLS
// não isolado com certeza no upload direto do client (`storage.objects`,
// bucket `abacatepay-produtos`) — a policy e o bucket conferem certinho
// contra o padrão já provado em produção (`parceiros-logos`), mas o upload
// real falhava com "new row violates row-level security policy" mesmo assim.
// Em vez de continuar caçando o motivo exato, esta function bypassa RLS de
// propósito (mesma razão de toda outra escrita deste painel passar por
// service_role) — mais robusto que depender do JWT do client chegar com o
// claim certo em toda chamada direta ao Storage.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "abacatepay-produtos";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserRoleFromJwt(authHeader: string): string {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1];
    const parsed = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof parsed.user_role === "string" ? parsed.user_role : "user";
  } catch {
    return "user";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth, error: authError } = await asUser.auth.getUser();
    if (authError || !auth?.user) return json({ error: "Sessão inválida." }, 401);
    if (getUserRoleFromJwt(authHeader) !== "admin") {
      return json({ error: "Apenas administradores podem executar essa ação." }, 403);
    }

    const body = await req.json().catch(() => null);
    const externalId = body?.externalId as string | undefined;
    const base64 = body?.base64 as string | undefined;
    if (!externalId || !base64) {
      return json({ error: "Campos 'externalId' e 'base64' são obrigatórios." }, 400);
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const path = `${externalId}/capa.jpg`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    console.error("admin-abacatepay-upload-imagem", error);
    return json({ error: (error as Error).message ?? "Erro inesperado" }, 500);
  }
});
