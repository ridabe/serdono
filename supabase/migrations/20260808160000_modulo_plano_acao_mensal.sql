-- Ser Dono — Módulo "Plano de Ação Mensal" (pedido do dono do produto em
-- 08/08/2026).
--
-- Todo mês, a partir do dia 1º, o empreendedor pode gerar um plano de ação
-- por IA: 1 objetivo do mês + 4 semanas de itens de checklist, baseado no
-- contexto real do negócio (Jornada, entregáveis, dados já preenchidos) e no
-- plano do mês anterior. Um plano por usuário por mês civil (`unique
-- (user_id, mes_referencia)`) — a trava de "só depois do dia 1º" e "só um por
-- mês" é decidida no servidor (Edge Function `plano-acao-gerar`), não no
-- client, porque nada impede outro client mal-comportado de tentar duas
-- gerações no mesmo mês.
--
-- Itens são fixos como a IA gerou (decisão do dono do produto) — o
-- empreendedor só marca/desmarca conclusão, nunca edita texto nem
-- adiciona/remove item. Por isso não existe policy de update/delete em
-- `planos_acao` (o cabeçalho nunca muda depois de criado) — só em
-- `planos_acao_itens.concluido`.

-- ============================================================================
-- Catálogo: quinto módulo (SDD-30). Liberação automática pra toda conta nova
-- (SDD-73) — não precisa de nenhuma ação extra do admin aqui.
-- ============================================================================
insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'plano-acao-mensal',
  'Plano de Ação Mensal',
  'Todo mês, um plano de ação gerado pela Mary a partir do seu negócio real — um objetivo e 4 semanas de passos práticos pra você ir marcando.',
  5,
  true
)
on conflict (slug) do nothing;

-- ============================================================================
-- Cabeçalho do plano — um por usuário por mês civil. `mes_referencia` é
-- sempre o dia 1º do mês (ex.: 2026-08-01), nunca a data real de geração.
-- ============================================================================
create table public.planos_acao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  objetivo text not null,
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, mes_referencia)
);

create index planos_acao_user_idx on public.planos_acao (user_id, mes_referencia desc);

alter table public.planos_acao enable row level security;

create policy "select_own" on public.planos_acao
  for select using (user_id = auth.uid());

create policy "insert_own" on public.planos_acao
  for insert with check (user_id = auth.uid());

-- ============================================================================
-- Itens do checklist — 4 semanas, texto fixo gerado pela IA. Único campo
-- editável pelo usuário é `concluido` (RN nova, ver PRD §12.9).
-- ============================================================================
create table public.planos_acao_itens (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos_acao (id) on delete cascade,
  semana smallint not null check (semana between 1 and 4),
  ordem smallint not null default 0,
  titulo text not null,
  concluido boolean not null default false,
  concluido_em timestamptz
);

create index planos_acao_itens_plano_idx on public.planos_acao_itens (plano_id);

alter table public.planos_acao_itens enable row level security;

-- Sem user_id direto — a posse vem de planos_acao.user_id, mesmo princípio
-- de select_own adaptado pra tabela filha (já usado em jornada_deliverables).
create policy "select_own" on public.planos_acao_itens
  for select using (
    exists (select 1 from public.planos_acao pa where pa.id = plano_id and pa.user_id = auth.uid())
  );

create policy "insert_own" on public.planos_acao_itens
  for insert with check (
    exists (select 1 from public.planos_acao pa where pa.id = plano_id and pa.user_id = auth.uid())
  );

create policy "update_own" on public.planos_acao_itens
  for update using (
    exists (select 1 from public.planos_acao pa where pa.id = plano_id and pa.user_id = auth.uid())
  );
