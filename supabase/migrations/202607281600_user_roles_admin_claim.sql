-- Ser Dono — Papéis de usuário e claim de admin (SPEC §4.3, SDD-5, SDD-22)
-- Toda alteração de schema com dado de usuário nasce com a proteção correta
-- na mesma migration (SPEC §4.1) — aqui a proteção é um revoke de coluna, já
-- que a policy "update_own" existente em public.users não restringe colunas.

alter table public.users
  add column role text not null default 'user'
    check (role in ('user', 'admin'));

-- A policy "update_own" (auth.uid() = id) permitiria a qualquer usuário
-- logado se autopromover a admin via PostgREST se não fosse por este revoke
-- de coluna — RLS restringe linhas, não colunas (mesmo aprendizado da
-- SDD-20). Só postgres/service_role podem alterar "role" a partir daqui.
revoke update (role) on public.users from authenticated, anon;

-- ============================================================================
-- Auth Hook: injeta o papel do usuário como custom claim "user_role" no JWT.
-- Contrato exigido pelo Supabase Auth Hooks: função recebe {user_id, claims},
-- devolve o mesmo evento com "claims" atualizado. Só supabase_auth_admin pode
-- executá-la — nunca client-side (senão qualquer usuário logado leria/chamaria
-- a função e potencialmente inferiria papéis de terceiros).
-- ============================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  user_role text;
  claims jsonb;
begin
  select role into user_role
  from public.users
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'user')));

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from public, authenticated, anon;
