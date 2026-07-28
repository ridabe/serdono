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
