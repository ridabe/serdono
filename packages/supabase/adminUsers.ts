import { supabase } from "./client";
import type { UserRole } from "./session";

/**
 * Gestão de usuários pelo Painel Admin (SDD-30). Leitura passa pela RPC
 * `admin_list_users` (não mais `select * from users`) porque a tela de
 * usuários agora mostra último acesso e sinaliza cadastro incompleto — os
 * dois só existem em `auth.users` (`last_sign_in_at`/`is_anonymous`), schema
 * que o PostgREST não expõe direto pro client. As escritas sensíveis (papel,
 * banimento) continuam passando pela Edge Function `admin-manage-user`
 * (service_role, `users.role` tem o UPDATE revogado de authenticated/anon
 * desde a SDD-22 e banir de verdade exige a Admin API do Supabase Auth).
 */
export interface AdminUser {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  role: UserRole;
  bloqueado: boolean;
  created_at: string;
  /** `null` quando a conta nunca fez login de verdade (só passou por sessão anônima). */
  last_sign_in_at: string | null;
  /** Sessão anônima que nunca completou o cadastro (SDD-63) — é a "base suja": tem diagnóstico/jornada mas nunca vira conta de verdade. */
  is_anonymous: boolean;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data as unknown as AdminUser[];
}

export async function inviteUser(params: { email: string; nome?: string; role?: UserRole }): Promise<string> {
  const { data, error } = await supabase.functions.invoke("admin-manage-user", {
    body: { action: "invite", ...params },
  });
  if (error) throw error;
  return data.user_id as string;
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-manage-user", {
    body: { action: "set_role", user_id: userId, role },
  });
  if (error) throw error;
}

export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-manage-user", {
    body: { action: "set_blocked", user_id: userId, blocked },
  });
  if (error) throw error;
}

/**
 * Exclusão definitiva (SDD-62) — via Admin API do Auth, cascateia (ON DELETE
 * CASCADE) pra `public.users` e todo dado do usuário (diagnóstico, jornada,
 * módulos liberados). Irreversível: a confirmação em duas etapas fica na
 * tela (`AdminUsersScreen.tsx`), não aqui.
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-manage-user", {
    body: { action: "delete", user_id: userId },
  });
  if (error) throw error;
}
