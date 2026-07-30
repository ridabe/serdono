-- Ser Dono — Fundação do Painel Admin: dashboard, gestão de usuários e
-- framework de módulos (SDD-30). Exceção à RN-2 registrada em PRD.md §3/§12.1
-- em 29/07/2026 — o framework de módulos nasce agora, o CONTEÚDO de cada
-- módulo de negócio continua Fase 3.

-- ============================================================================
-- Bloqueio de usuário (espelha o ban real de auth.users — evita ter que
-- chamar a Admin API só pra listar status na tela de gestão de usuários)
-- ============================================================================
alter table public.users add column bloqueado boolean not null default false;

create policy "users_read_admin" on public.users
  for select using (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Catálogo de módulos (mesmo padrão de RLS de public.niches)
-- ============================================================================
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modules_read_all" on public.modules
  for select using (auth.role() = 'authenticated');

create policy "modules_write_admin" on public.modules
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_modules_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Liberação de módulo por usuário — independe de plano pago (ainda não
-- existe gateway/assinatura no produto, PRD §17 pendente); controlado
-- manualmente pelo admin.
-- ============================================================================
create table public.user_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  habilitado boolean not null default true,
  habilitado_em timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.user_modules enable row level security;

create policy "select_own" on public.user_modules
  for select using (auth.uid() = user_id);

create policy "all_admin" on public.user_modules
  for all using (auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================================
-- Estatísticas do dashboard admin — RPC agregada em vez de abrir SELECT
-- amplo em diagnostic_responses/niche_matches (dado pessoal): admin recebe
-- só contagens, RLS dessas tabelas não muda. Pensado pra crescer (novos
-- campos aqui = novo card no dashboard, sem migration de RLS nova).
-- ============================================================================
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'total_usuarios', (select count(*) from public.users),
    'novos_usuarios_7d', (select count(*) from public.users where created_at > now() - interval '7 days'),
    'usuarios_bloqueados', (select count(*) from public.users where bloqueado = true),
    'diagnosticos_concluidos', (select count(*) from public.diagnostic_responses where status_preenchimento = 'concluido'),
    'nichos_destravados', (select count(*) from public.niche_matches)
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
