-- Ser Dono — Sincronizar public.users.email quando auth.users.email muda
-- depois da criação (SDD-63).
--
-- BUG ENCONTRADO: `handle_new_auth_user()` (20260728153918_diagnostico_e_nichos.sql)
-- só roda em AFTER INSERT — copia `email` do momento em que a linha de
-- `auth.users` nasce. Para sessão anônima (Supabase Auth trata anonymous
-- sign-in como `auth.users` normal com `is_anonymous=true`), `email` nasce
-- `null`; quando essa pessoa depois vira conta real (confirma um e-mail via
-- `updateUser`/link de identidade), `auth.users.email` é atualizado, mas
-- não existia nenhum trigger de UPDATE pra propagar isso — `public.users.email`
-- fica `null` pra sempre, mesmo a conta já tendo e-mail de verdade. Efeito
-- visível: a aba Authentication do Supabase mostra o e-mail certo, mas o
-- Painel Admin (que lê `public.users`) mostra vazio — duas fontes divergindo
-- sobre o mesmo usuário, motivo real da confusão reportada.
--
-- CORREÇÃO: trigger de UPDATE que só dispara quando `email` de fato muda
-- (`when (new.email is distinct from old.email)`), copiando pra
-- `public.users`. Mesmo padrão de `handle_new_auth_user` (security definer,
-- search_path fixo, bypassa RLS).

create or replace function public.handle_auth_user_email_updated()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.handle_auth_user_email_updated();

-- ============================================================================
-- Backfill: corrige o drift que já existia antes deste trigger existir.
-- Não altera contas genuinamente anônimas (auth.users.email também null) —
-- só sincroniza onde os dois lados já divergem de fato.
-- ============================================================================
update public.users u
set email = a.email
from auth.users a
where a.id = u.id
  and u.email is distinct from a.email;
