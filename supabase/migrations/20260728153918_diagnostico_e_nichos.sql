-- Ser Dono — Diagnóstico e Match de Nichos (PRD §5.1, §5.2, §5.3)
-- Toda tabela com dado de usuário nasce com RLS habilitada nesta mesma migration (SPEC §4.1).

-- ============================================================================
-- Utilitário: trigger genérico de updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 5.1 Identidade — public.users (espelha auth.users, estendida)
-- ============================================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text unique,
  telefone text,
  cidade text,
  estado text,
  criado_via text not null default 'organico'
    check (criado_via in ('organico', 'pago', 'indicacao', 'institucional')),
  onboarding_status text not null default 'cadastrado'
    check (onboarding_status in ('cadastrado', 'diagnostico_concluido', 'assinante', 'negocio_aberto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "select_own" on public.users
  for select using (auth.uid() = id);

create policy "update_own" on public.users
  for update using (auth.uid() = id);

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Toda linha de auth.users (inclusive sessão anônima — Supabase Auth trata
-- anonymous sign-in como um auth.users normal com is_anonymous=true) ganha
-- uma linha espelho em public.users, via trigger security definer (bypassa RLS).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- 5.2 Diagnóstico — public.diagnostic_responses
-- ============================================================================
create table public.diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  schema_version int not null default 1, -- RN-4: questionário evolui sem quebrar respostas antigas
  capital_disponivel text
    check (capital_disponivel in ('ate_5k', '5k_15k', '15k_40k', 'mais_40k')), -- RN-5: sempre faixa, nunca valor livre
  meses_de_folego int,
  apetite_risco int check (apetite_risco between 1 and 5),
  tempo_disponivel text
    check (tempo_disponivel in ('integral', 'parcial', 'paralelo_emprego')),
  formacao text[] not null default '{}',
  experiencia text[] not null default '{}',
  estilo_vida jsonb not null default '{}',
  localizacao_cidade text,
  localizacao_estado text,
  rede_ativos text[] not null default '{}',
  objetivo text
    check (objetivo in ('renda_extra', 'substituir_salario', 'escalar')),
  status_preenchimento text not null default 'em_andamento'
    check (status_preenchimento in ('em_andamento', 'concluido')), -- RN-13: progresso salvo a cada bloco
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnostic_responses enable row level security;

create policy "select_own" on public.diagnostic_responses
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.diagnostic_responses
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.diagnostic_responses
  for update using (auth.uid() = user_id);

create trigger set_diagnostic_responses_updated_at
  before update on public.diagnostic_responses
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5.3 Nichos — public.niches (dado de catálogo/configuração, não por usuário)
-- ============================================================================
create table public.niches (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  categoria text not null,
  investimento_min numeric not null,
  investimento_max numeric not null,
  tempo_ate_equilibrio_meses int,
  complexidade_regulatoria int not null check (complexidade_regulatoria between 1 and 5),
  sazonalidade jsonb not null default '{}',
  margem_tipica_pct numeric,
  intensidade_mao_de_obra int not null check (intensidade_mao_de_obra between 1 and 5),
  dependencia_ponto_fisico boolean not null default false,
  nivel_concorrencia int not null check (nivel_concorrencia between 1 and 5),
  perfil_cliente text,
  playbook_md text,
  fonte text, -- RN-20: todo dado de mercado citado tem fonte e data visíveis
  fonte_data date,
  ativo_no_mvp boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.niches enable row level security;

-- SDD-5: somente-leitura para qualquer usuário autenticado (inclui sessão anônima),
-- somente-escrita por um papel admin via custom claim no JWT.
create policy "niches_read_all" on public.niches
  for select using (auth.role() = 'authenticated');

create policy "niches_write_admin" on public.niches
  for all using (auth.jwt() ->> 'user_role' = 'admin');

create trigger set_niches_updated_at
  before update on public.niches
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5.3 Resultado do motor — public.niche_matches
-- ============================================================================
create table public.niche_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  niche_id uuid not null references public.niches (id) on delete cascade,
  fit_score numeric not null check (fit_score between 0 and 100), -- calculado, nunca gerado por IA (PRD, glossário)
  score_perfil numeric not null check (score_perfil between 0 and 100),
  score_financeiro numeric not null check (score_financeiro between 0 and 100),
  score_contexto numeric not null check (score_contexto between 0 and 100),
  score_tempo numeric not null check (score_tempo between 0 and 100),
  justificativa_ia text, -- gerado por IA (Claude), só explica a nota já calculada
  gerado_em timestamptz not null default now(),
  unique (user_id, niche_id)
);

alter table public.niche_matches enable row level security;

create policy "select_own" on public.niche_matches
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.niche_matches
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.niche_matches
  for update using (auth.uid() = user_id);
