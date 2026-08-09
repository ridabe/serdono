-- Ser Dono — Módulo "Check-up Mensal do Negócio" (pedido do dono do produto
-- em 08/08/2026, citado como PRIORIDADE Nº 1 — por isso `ordem = 1`, logo
-- depois da Jornada Empreendedora no catálogo).
--
-- Uma vez por mês, a Mary faz um questionário curto (4 seções: Financeiro,
-- Clientes, Marketing, Operação — ~16 perguntas fechadas, "menos de 5
-- minutos") e a IA devolve um raio-x qualitativo do negócio: status por
-- categoria (verde/amarelo/vermelho), uma pontuação geral 0-100 e as 3
-- prioridades do mês. Pedido explícito de conexão com o Plano de Ação
-- Mensal (SDD-86): o check-up mais recente entra no contexto da geração do
-- plano, pra ele ficar ciente do que realmente aconteceu no negócio, não só
-- do que já foi feito na Jornada.

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'checkup-mensal',
  'Check-up Mensal do Negócio',
  'Uma vez por mês eu faço um raio-x rápido do seu negócio — menos de 5 minutos — e te digo onde focar.',
  1,
  true
)
on conflict (slug) do nothing;

-- Backfill (premissa da SDD-87): sem isso, ninguém que já tinha conta antes
-- de hoje veria o pop-up de novidade desse módulo na Início.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'checkup-mensal'
on conflict (user_id, module_id) do update set novidade_vista = false;

-- ============================================================================
-- Um check-up por usuário por mês civil — mesma convenção de `planos_acao`
-- (SDD-86): `mes_referencia` é sempre dia 1º. Imutável depois de gerado (sem
-- policy de update/delete) — as respostas são o retrato daquele mês, editar
-- depois não faria sentido.
-- ============================================================================
create table public.checkups_mensais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  respostas jsonb not null,
  saude jsonb not null,
  gerado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, mes_referencia)
);

create index checkups_mensais_user_idx on public.checkups_mensais (user_id, mes_referencia desc);

alter table public.checkups_mensais enable row level security;

create policy "select_own" on public.checkups_mensais
  for select using (user_id = auth.uid());

create policy "insert_own" on public.checkups_mensais
  for insert with check (user_id = auth.uid());
