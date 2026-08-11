-- Ser Dono — Módulo "Raio-X Financeiro" (pedido do dono do produto em
-- 09/08/2026): fechamento financeiro mensal simples — faturamento, despesas
-- e retirada do sócio — comparado com o mês anterior, com lançamento de
-- despesas do dia a dia pra sugerir o total de despesas do mês.
--
-- Sem IA (decisão do dono do produto, mesma sessão): o comentário da Mary é
-- regra determinística sobre os números reais (packages/core/raioxFinanceiro.ts),
-- não texto gerado — mais barato, instantâneo, e sem risco de inventar uma
-- tendência que os números não sustentam (PRD §4, honestidade de dado).

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'raio-x-financeiro',
  'Raio-X Financeiro',
  'Uma vez por mês, feche seu faturamento, despesas e retirada — e veja como está evoluindo mês a mês.',
  7,
  true
)
on conflict (slug) do nothing;

-- Backfill (premissa da SDD-87): sem isso, quem já tinha conta antes de hoje
-- não veria o pop-up de novidade desse módulo na Início.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'raio-x-financeiro'
on conflict (user_id, module_id) do update set novidade_vista = false;

-- ============================================================================
-- Lançamento livre de despesas do dia a dia — tipo + descrição opcional +
-- valor. Ao contrário dos fechamentos mensais abaixo, isto NÃO é imutável:
-- é um lançamento de uso diário, o usuário pode corrigir/apagar um item
-- errado a qualquer momento (RLS completo: select/insert/update/delete, só
-- do próprio dono).
-- ============================================================================
create table public.raiox_despesas_diarias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  tipo text not null,
  descricao text,
  valor numeric(12, 2) not null check (valor > 0),
  created_at timestamptz not null default now()
);

create index raiox_despesas_diarias_user_idx on public.raiox_despesas_diarias (user_id, data desc);

alter table public.raiox_despesas_diarias enable row level security;

create policy "select_own" on public.raiox_despesas_diarias
  for select using (user_id = auth.uid());

create policy "insert_own" on public.raiox_despesas_diarias
  for insert with check (user_id = auth.uid());

create policy "update_own" on public.raiox_despesas_diarias
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "delete_own" on public.raiox_despesas_diarias
  for delete using (user_id = auth.uid());

-- ============================================================================
-- Fechamento mensal: os 3 números que o empreendedor confirma uma vez por
-- mês (faturamento, despesas — sugerido a partir da soma de
-- `raiox_despesas_diarias`, mas o valor final digitado é o que fica salvo —,
-- e quanto retirou pra ele mesmo). Mesma convenção de `checkups_mensais`/
-- `planos_acao` (SDD-86/90): `mes_referencia` sempre dia 1º, um por
-- usuário por mês, imutável depois de gerado (sem policy de update/delete)
-- — é o retrato daquele mês fechado, não uma planilha viva.
-- ============================================================================
create table public.raiox_financeiro_mensal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  faturamento numeric(12, 2) not null check (faturamento >= 0),
  despesas numeric(12, 2) not null check (despesas >= 0),
  retirada_socio numeric(12, 2) not null default 0 check (retirada_socio >= 0),
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, mes_referencia)
);

create index raiox_financeiro_mensal_user_idx on public.raiox_financeiro_mensal (user_id, mes_referencia desc);

alter table public.raiox_financeiro_mensal enable row level security;

create policy "select_own" on public.raiox_financeiro_mensal
  for select using (user_id = auth.uid());

create policy "insert_own" on public.raiox_financeiro_mensal
  for insert with check (user_id = auth.uid());
