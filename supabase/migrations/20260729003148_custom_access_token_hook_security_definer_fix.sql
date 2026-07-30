create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
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

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from public, authenticated, anon;
