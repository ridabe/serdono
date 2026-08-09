-- Ser Dono — Infraestrutura de notificação push (pedido do dono do produto
-- em 08/08/2026): opt-in do usuário + lembretes automáticos gerados por
-- análise diária de cada módulo (Jornada parada, Check-up mensal pendente,
-- obrigação vencendo).

-- ============================================================================
-- Tokens de push por usuário (Expo Push Token) — um usuário pode ter mais de
-- um (celular novo, reinstalação sem apagar o antigo primeiro). Token é
-- único no mundo (identifica o par app+aparelho no serviço da Expo), por
-- isso o UPSERT do client usa `expo_push_token` como chave de conflito, não
-- `user_id` — reassocia automaticamente se o mesmo aparelho logar em outra
-- conta.
-- ============================================================================
create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_push_tokens_user_idx on public.user_push_tokens (user_id);

alter table public.user_push_tokens enable row level security;

create policy "select_own" on public.user_push_tokens
  for select using (user_id = auth.uid());

create policy "insert_own" on public.user_push_tokens
  for insert with check (user_id = auth.uid());

create policy "update_own" on public.user_push_tokens
  for update using (user_id = auth.uid());

create policy "delete_own" on public.user_push_tokens
  for delete using (user_id = auth.uid());

create trigger set_user_push_tokens_updated_at
  before update on public.user_push_tokens
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Dedupe de lembretes — evita reenviar o mesmo aviso todo dia enquanto a
-- condição continuar valendo (ex.: etapa parada continua parada por
-- semanas). `chave` identifica a ocorrência específica (id da etapa, mês de
-- referência do check-up, obrigação+período) — só service_role escreve e lê
-- (RLS habilitada, ZERO policies: ninguém autenticado via PostgREST toca
-- aqui, só a Edge Function via service_role, que ignora RLS por natureza).
-- ============================================================================
create table public.lembretes_enviados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('jornada_etapa_parada', 'checkup_mensal', 'obrigacao_vencendo')),
  chave text not null,
  enviado_em timestamptz not null default now(),
  unique (user_id, tipo, chave)
);

alter table public.lembretes_enviados enable row level security;

-- ============================================================================
-- Extensões pro agendamento (pg_cron dispara diariamente, pg_net faz a
-- chamada HTTP assíncrona pra Edge Function `lembretes-diarios` sem
-- bloquear o worker do cron).
-- ============================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;
