-- Ser Dono — Cobrança via AbacatePay (pedido do dono do produto, 17/08/2026).
-- 3 planos: Gratuito, Essencial (R$ 19,90/mês lançamento), Master (R$ 39,90/mês
-- lançamento). Gateway escolhido resolve PRD §17 item 2. Checkout nasce sempre
-- na web (RN-17/RNF-8) — o app Android só abre o link, nunca cobra dentro do
-- app (evita comissão de loja de 15-30%).

-- users ganha o plano vigente (denormalizado — mesmo padrão de users.role/
-- onboarding_status, evita recalcular "assinatura ativa mais recente" em toda
-- leitura de módulo).
alter table public.users add column plano_atual text not null default 'gratuito'
  check (plano_atual in ('gratuito','essencial','master'));

-- Grandfather (pedido explícito do dono do produto): toda conta que já existia
-- antes desta migration vira master — ninguém que já usa o produto hoje perde
-- acesso quando o gate entrar no ar. Só cadastros feitos DEPOIS desta migration
-- nascem 'gratuito' (o default da coluna).
update public.users set plano_atual = 'master';

-- modules ganha o piso de plano exigido — 'gratuito' (default) = sem gate,
-- mantém o comportamento atual pra módulo não migrado. jornada-empreendedora
-- fica 'gratuito' de propósito: o gate dela é por FASE, dentro do próprio
-- módulo (JornadaScreen.tsx), não no catálogo.
alter table public.modules add column plano_minimo text not null default 'gratuito'
  check (plano_minimo in ('gratuito','essencial','master'));

update public.modules set plano_minimo = 'essencial' where slug in ('parceiros-fornecedores','meu-negocio-em-dia');
update public.modules set plano_minimo = 'master' where slug in
  ('checkup-mensal','plano-acao-mensal','raio-x-financeiro','nivel-maturidade',
   'retencao-clientes','preparar-reuniao','mentoria-investimentos','assistente-contrato');

-- ============================================================================
-- Histórico/vínculo com a AbacatePay — fonte de verdade que o webhook
-- (assinatura-webhook) escreve; users.plano_atual é só o cache de leitura
-- rápida usado pelo gate de módulo/fase. Sem policy de insert/update/delete
-- pro client — só as Edge Functions (service_role) escrevem; o usuário só lê
-- a própria linha.
-- ============================================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plano text not null check (plano in ('essencial','master')),
  status text not null check (status in ('pendente','ativa','cancelada','inadimplente')),
  ciclo text not null default 'mensal',
  preco_centavos integer not null,
  abacatepay_customer_id text,
  abacatepay_billing_id text,
  abacatepay_external_id text not null unique,
  iniciado_em timestamptz,
  renovado_em timestamptz,
  cancelado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id, created_at desc);

alter table public.subscriptions enable row level security;

create policy "select_own" on public.subscriptions
  for select using (user_id = auth.uid());
