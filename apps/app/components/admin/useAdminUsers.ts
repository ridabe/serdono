import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  type AdminUser,
  type UserRole,
  deleteUser,
  inviteUser,
  listUsers,
  requestPasswordReset,
  setUserBlocked,
  setUserRole,
} from "@serdono/supabase";

/**
 * Gestão de usuários do Painel Admin (SDD-30) — carregar/buscar/agir, fora
 * do componente de tela (SDD-3), reusável se a lista precisar aparecer em
 * mais de um lugar no futuro.
 */
export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.nome ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.telefone ?? "").toLowerCase().includes(q)
    );
  });

  const incompletos = filtered.filter((u) => u.is_anonymous);

  async function runAction(userId: string, action: () => Promise<void>, successMessage: string) {
    setActingOn(userId);
    setError(null);
    setFeedback(null);
    try {
      await action();
      setFeedback(successMessage);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingOn(null);
    }
  }

  /**
   * Remove em lote todas as contas anônimas que nunca completaram o
   * cadastro (SDD-63: `is_anonymous`/`email is null`) — a "base suja" que o
   * dono do produto pediu pra limpar. Reusa `deleteUser` (Admin API,
   * cascateia pra todo dado da conta) uma a uma; sequencial de propósito,
   * pra não estourar rate limit da Admin API do Supabase com dezenas de
   * chamadas simultâneas.
   */
  async function removeIncompletos() {
    setActingOn("bulk_incompletos");
    setError(null);
    setFeedback(null);
    const alvo = users.filter((u) => u.is_anonymous);
    let removidos = 0;
    try {
      for (const u of alvo) {
        await deleteUser(u.id);
        removidos++;
      }
      setFeedback(`${removidos} cadastro${removidos === 1 ? "" : "s"} incompleto${removidos === 1 ? "" : "s"} removido${removidos === 1 ? "" : "s"}.`);
      await refresh();
    } catch (e) {
      setError(`Removidos ${removidos} de ${alvo.length} antes do erro: ${(e as Error).message}`);
      await refresh();
    } finally {
      setActingOn(null);
    }
  }

  return {
    users: filtered,
    incompletos,
    query,
    setQuery,
    loading,
    actingOn,
    error,
    feedback,
    refresh,
    removeIncompletos,
    invite: (params: { email: string; nome?: string; role?: UserRole }) =>
      runAction("new", () => inviteUser(params).then(() => undefined), "Convite enviado."),
    toggleBlocked: (user: AdminUser) =>
      runAction(user.id, () => setUserBlocked(user.id, !user.bloqueado), user.bloqueado ? "Usuário desbloqueado." : "Usuário bloqueado."),
    toggleAdmin: (user: AdminUser) =>
      runAction(
        user.id,
        () => setUserRole(user.id, user.role === "admin" ? "user" : "admin"),
        user.role === "admin" ? "Admin removido." : "Usuário promovido a admin."
      ),
    resendPassword: (user: AdminUser) =>
      runAction(
        user.id,
        async () => {
          if (!user.email) throw new Error("Este usuário não tem e-mail cadastrado.");
          await requestPasswordReset(user.email, Linking.createURL("login/redefinir-senha"));
        },
        "Link de redefinição enviado."
      ),
    remove: (user: AdminUser) => runAction(user.id, () => deleteUser(user.id), "Usuário excluído."),
  };
}
