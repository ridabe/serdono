-- Ser Dono — Corrige `admin_list_users`: achado testando a tela nova, existem
-- linhas de `auth.users` anônimas (`is_anonymous = true`) sem espelho em
-- `public.users` — o `handle_new_auth_user` deveria ter criado a linha
-- (trigger AFTER INSERT em auth.users, sem exceção documentada pra sessão
-- anônima), mas 3 contas reais do projeto não têm. A versão anterior desta
-- RPC usava INNER JOIN a partir de `public.users`, então essas contas —
-- exatamente o tipo de "cadastro incompleto" que a tela existe pra limpar —
-- ficavam invisíveis pro admin. `auth.users` é a fonte de verdade de toda
-- conta que existe; `public.users` é só a extensão, então o JOIN inverte.
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
  select a.id, u.nome, coalesce(u.email, a.email), u.telefone, coalesce(u.role, 'user'), coalesce(u.bloqueado, false),
         coalesce(u.created_at, a.created_at), a.last_sign_in_at, coalesce(a.is_anonymous, false)
  from auth.users a
  left join public.users u on u.id = a.id
  order by coalesce(u.created_at, a.created_at) desc;
end;
$$;
