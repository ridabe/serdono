-- Ser Dono — Hardening de funções (advisors de segurança)
-- 1) search_path fixo em set_updated_at (evita search_path hijacking)
-- 2) handle_new_auth_user é SECURITY DEFINER só para uso via trigger em auth.users;
--    por padrão o Postgres concede EXECUTE a PUBLIC, o que a expõe como RPC
--    pública (/rest/v1/rpc/handle_new_auth_user) para anon/authenticated.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;
