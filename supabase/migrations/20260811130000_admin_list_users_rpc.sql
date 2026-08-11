-- Ser Dono — RPC `admin_list_users`, base da nova tela de Usuários (tabela
-- com último acesso e identificação de cadastro incompleto).
--
-- `public.users` não tem `last_sign_in_at` nem `is_anonymous` — esses dois só
-- existem em `auth.users`, schema que o PostgREST não expõe pro client. Uma
-- função SECURITY DEFINER (mesmo padrão de `admin_dashboard_stats`) é o jeito
-- de juntar as duas sem abrir `auth.users` pro client.
--
-- `is_anonymous = true` (Supabase Auth trata sessão anônima como
-- `auth.users` normal com essa flag, ver `session.ts::ensureSession`) é o
-- mesmo sinal que `public.users.email is null` (RN documentada na migration
-- `20260803230000_sincronizar_email_auth_users.sql`): conta que abriu sessão
-- (às vezes já preencheu diagnóstico/jornada) mas nunca completou o cadastro
-- de verdade — a "base suja" que o admin precisa poder limpar.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  nome text,
  email text,
  telefone text,
  role text,
  bloqueado boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_anonymous boolean
)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select u.id, u.nome, u.email, u.telefone, u.role, u.bloqueado, u.created_at,
         a.last_sign_in_at, coalesce(a.is_anonymous, false)
  from public.users u
  join auth.users a on a.id = u.id
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
