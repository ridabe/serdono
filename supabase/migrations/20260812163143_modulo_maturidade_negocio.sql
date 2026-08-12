-- Ser Dono — Módulo "Nível de Maturidade do Negócio" + "Ser Dono Score"
-- (pedido do dono do produto, 12/08/2026): gamificação da evolução pós-
-- Jornada. Um selo de 5 estágios (🌱 Iniciante → 💎 Preparado para escalar) e
-- um score de 0 a 1000, com 5 sub-pontuações por categoria (Financeiro,
-- Marketing, Clientes, Organização, Crescimento) julgadas pela Mary a partir
-- de dado real já existente em outros módulos (Jornada, Check-up Mensal,
-- Plano de Ação, Raio-X Financeiro) — nenhuma pergunta nova ao usuário.
--
-- Conceito GLOBAL, separado do diagnóstico de maturidade organizacional 1-4
-- da Jornada (PRD §9.12, `organizacaoMaturidade.ts`) — aquele avalia só a
-- etapa Organização; este é o retrato do negócio inteiro (SPEC.md, nova
-- entrada SDD).

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'nivel-maturidade',
  'Nível de Maturidade',
  'Seu nível de evolução como negócio e o Ser Dono Score — a partir do que você já preencheu na Jornada, no Check-up e no Plano de Ação.',
  8,
  true
)
on conflict (slug) do nothing;

-- Backfill (premissa da SDD-87): sem isso, ninguém que já tinha conta antes
-- de hoje veria o módulo liberado nem o pop-up de novidade na Início.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'nivel-maturidade'
on conflict (user_id, module_id) do update set novidade_vista = false;

-- ============================================================================
-- Um retrato por usuário por mês civil — mesma convenção de `checkups_mensais`/
-- `planos_acao`: `mes_referencia` é sempre dia 1º. Imutável depois de gerado
-- (sem policy de update/delete): o snapshot é o retrato daquele mês, editar
-- depois não faria sentido (mesmo princípio de honestidade do Fit Score).
-- ============================================================================
create table public.maturidade_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  categorias jsonb not null,
  pontuacao_total smallint not null check (pontuacao_total between 0 and 1000),
  nivel text not null,
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, mes_referencia)
);

create index maturidade_snapshots_user_idx on public.maturidade_snapshots (user_id, mes_referencia desc);

alter table public.maturidade_snapshots enable row level security;

create policy "select_own" on public.maturidade_snapshots
  for select using (user_id = auth.uid());

create policy "insert_own" on public.maturidade_snapshots
  for insert with check (user_id = auth.uid());
