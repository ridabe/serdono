import { supabase } from "./client";
import type { UserRole } from "./session";
import type { Tables } from "./types";

export type AdminUser = Tables<"users">;

/**
 * Gestão de usuários pelo Painel Admin (SDD-30). Leitura de todas as linhas
 * é liberada por RLS (`users_read_admin`) — as escritas sensíveis (papel,
 * banimento) passam pela Edge Function `admin-manage-user`, que usa a
 * service_role key, porque `users.role` tem o UPDATE revogado de
 * authenticated/anon desde a SDD-22 e banir de verdade exige a Admin API do
 * Supabase Auth.
 */
export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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
