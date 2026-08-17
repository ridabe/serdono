-- Ser Dono — Painel Admin de Assinaturas (pedido do dono do produto,
-- 17/08/2026, mesma tarde de SDD-113): controle de assinaturas, dashboard de
-- planos mais assinados, inadimplência e estimativa de receita (real vs.
-- potencial), + concessão/alteração manual de plano pelo admin.
--
-- `subscriptions` ganha `origem` — distingue assinatura de verdade (webhook
-- da AbacatePay confirmou pagamento) de plano concedido manualmente pelo
-- admin (RN nova: "brinde"/cortesia, ou correção manual — as duas situações
-- viram a mesma coisa aqui: só o que passou pelo checkout real conta como
-- receita REAL; qualquer concessão do admin é sempre `concedido_admin`,
-- nunca fabricamos um `abacatepay_billing_id` de verdade). `nota`/`concedido_por`
-- dão rastro de auditoria de quem concedeu o quê e por quê.
alter table public.subscriptions add column origem text not null default 'abacatepay'
  check (origem in ('abacatepay','concedido_admin'));
alter table public.subscriptions add column concedido_por uuid references auth.users(id);
alter table public.subscriptions add column nota text;

-- ============================================================================
-- Resumo (KPIs) — MRR real (só `origem = 'abacatepay'`, status `ativa`) vs.
-- MRR potencial (toda assinatura ativa, incluindo cortesia do admin — "o que
-- entraria se esse cliente pagasse", pedido explícito do dono do produto).
-- ============================================================================
create or replace function public.admin_assinaturas_resumo()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'mrr_real_centavos', (select coalesce(sum(preco_centavos), 0) from public.subscriptions where status = 'ativa' and origem = 'abacatepay'),
    'mrr_potencial_centavos', (select coalesce(sum(preco_centavos), 0) from public.subscriptions where status = 'ativa'),
    'ativos_pagos', (select count(*) from public.subscriptions where status = 'ativa' and origem = 'abacatepay'),
    'ativos_cortesia', (select count(*) from public.subscriptions where status = 'ativa' and origem = 'concedido_admin'),
    'inadimplentes', (select count(*) from public.subscriptions where status = 'inadimplente'),
    'gratuitos', (select count(*) from public.users where plano_atual = 'gratuito'),
    'total_usuarios', (select count(*) from public.users)
  );
end;
$$;

revoke execute on function public.admin_assinaturas_resumo() from public;
grant execute on function public.admin_assinaturas_resumo() to authenticated;

-- ============================================================================
-- Planos mais assinados — contagem + receita real por plano, só `ativa`.
-- ============================================================================
create or replace function public.admin_assinaturas_por_plano()
returns table (plano text, ativos bigint, ativos_cortesia bigint, receita_real_centavos bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select s.plano,
         count(*) filter (where s.origem = 'abacatepay'),
         count(*) filter (where s.origem = 'concedido_admin'),
         coalesce(sum(s.preco_centavos) filter (where s.origem = 'abacatepay'), 0)
  from public.subscriptions s
  where s.status = 'ativa'
  group by s.plano
  order by s.plano;
end;
$$;

revoke execute on function public.admin_assinaturas_por_plano() from public;
grant execute on function public.admin_assinaturas_por_plano() to authenticated;

-- ============================================================================
-- Lista completa (histórico) — junta com `auth.users` pelo mesmo motivo de
-- `admin_list_users` (e-mail não é espelhado em `public.users` pra toda
-- conta). `filtro_status` opcional isola só inadimplentes na tela.
-- ============================================================================
create or replace function public.admin_assinaturas_listar(filtro_status text default null)
returns table (
  id uuid,
  user_id uuid,
  nome text,
  email text,
  plano text,
  status text,
  origem text,
  preco_centavos integer,
  nota text,
  created_at timestamptz,
  renovado_em timestamptz,
  cancelado_em timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select s.id, s.user_id, coalesce(u.nome, a.email, 'Sem nome'), coalesce(u.email, a.email),
         s.plano, s.status, s.origem, s.preco_centavos, s.nota, s.created_at, s.renovado_em, s.cancelado_em
  from public.subscriptions s
  join auth.users a on a.id = s.user_id
  left join public.users u on u.id = s.user_id
  where filtro_status is null or s.status = filtro_status
  order by s.created_at desc;
end;
$$;

revoke execute on function public.admin_assinaturas_listar(text) from public;
grant execute on function public.admin_assinaturas_listar(text) to authenticated;

-- ============================================================================
-- Plano vigente de todo usuário (pra tela poder mostrar "gratuito" mesmo pra
-- quem nunca teve linha em `subscriptions`) — junta `users.plano_atual` com a
-- assinatura ativa mais recente, se existir.
-- ============================================================================
create or replace function public.admin_planos_usuarios()
returns table (user_id uuid, nome text, email text, plano_atual text, assinatura_id uuid, origem text)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select a.id, coalesce(u.nome, a.email, 'Sem nome'), coalesce(u.email, a.email), coalesce(u.plano_atual, 'gratuito'),
         s.id, s.origem
  from auth.users a
  left join public.users u on u.id = a.id
  left join lateral (
    select sub.id, sub.origem from public.subscriptions sub
    where sub.user_id = a.id and sub.status = 'ativa'
    order by sub.created_at desc limit 1
  ) s on true
  order by coalesce(u.created_at, a.created_at) desc;
end;
$$;

revoke execute on function public.admin_planos_usuarios() from public;
grant execute on function public.admin_planos_usuarios() to authenticated;
