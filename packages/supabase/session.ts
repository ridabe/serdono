import { supabase } from "./client";

/**
 * Diagnóstico roda antes do cadastro (fora do sistema logado) para gerar o
 * "uau" inicial e só então mandar para /cadastro — mas toda tabela com dado
 * de usuário exige RLS por auth.uid() (SPEC §4.2). A saída é usar sessão
 * anônima do Supabase Auth: cria um auth.users real (role "authenticated",
 * is_anonymous=true), que já satisfaz toda política RLS existente sem
 * nenhuma exceção de segurança para "usuário ainda não cadastrado".
 *
 * No cadastro (packages/supabase não faz isso — ver app/cadastro.tsx), essa
 * mesma sessão vira uma conta permanente via `supabase.auth.updateUser`,
 * preservando o auth.uid() e, com ele, diagnostic_responses/niche_matches
 * já salvos.
 */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session;
  }

  const { data: anonData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }
  return anonData.session;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function isAnonymousSession(session: { user: { is_anonymous?: boolean } } | null): boolean {
  return Boolean(session?.user?.is_anonymous);
}

export type UserRole = "user" | "admin";

/**
 * Lê o claim custom "user_role" injetado no JWT pelo Auth Hook
 * `custom_access_token_hook` (SPEC.md SDD-5/SDD-22) — nunca de uma coluna
 * lida por RLS comum, para não vazar quem é admin. Se o Hook ainda não
 * estiver habilitado no projeto Supabase (ação pendente de dashboard), o
 * claim não existe e o fallback é sempre "user" — fail-safe, nunca admin
 * por omissão.
 */
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Decoder manual em vez de `atob` (indisponível em todo runtime Hermes/RN) —
// portátil entre web, iOS e Android sem depender de polyfill global.
function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    if (char === "=") break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return decodeURIComponent(
    output
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function getUserRole(session: { access_token: string } | null): UserRole {
  if (!session?.access_token) return "user";
  try {
    const payload = session.access_token.split(".")[1];
    const json = JSON.parse(decodeBase64Url(payload));
    return json.user_role === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}
