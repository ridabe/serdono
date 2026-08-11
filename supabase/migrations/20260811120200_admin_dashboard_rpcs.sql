-- Ser Dono — RPCs agregadas do novo Dashboard Admin ("Torre de Controle").
-- Mesmo espírito de `admin_dashboard_stats` (admin_panel_foundation): nunca
-- abrir SELECT amplo pro client em tabela de dado pessoal — o admin só recebe
-- contagem/agregação, RLS das tabelas de origem não muda.
--
-- Dividida em várias funções pequenas (em vez de 1 jsonb gigante) porque
-- várias delas devolvem LINHAS (série temporal, ranking), não um escalar —
-- `admin_dashboard_stats` continua sendo a fonte dos 5 KPIs originais.

-- ============================================================================
-- Crescimento de usuários — cadastros por dia, últimos N dias (padrão 30).
-- ============================================================================
create or replace function public.admin_user_growth(dias int default 30)
returns table (dia date, novos_usuarios bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select d::date, count(u.id)
  from generate_series(current_date - (dias - 1), current_date, interval '1 day') d
  left join public.users u on date_trunc('day', u.created_at) = d
  group by d
  order by d;
end;
$$;

revoke execute on function public.admin_user_growth(int) from public;
grant execute on function public.admin_user_growth(int) to authenticated;

-- ============================================================================
-- Adoção por módulo — quantos usuários têm cada módulo habilitado.
-- ============================================================================
create or replace function public.admin_module_adoption()
returns table (modulo text, habilitados bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select m.nome, count(um.id) filter (where um.habilitado = true)
  from public.modules m
  left join public.user_modules um on um.module_id = m.id
  group by m.id, m.nome
  order by count(um.id) filter (where um.habilitado = true) desc;
end;
$$;

revoke execute on function public.admin_module_adoption() from public;
grant execute on function public.admin_module_adoption() to authenticated;

-- ============================================================================
-- Fornecedores por categoria (não "por nicho" — `categoria` é o único campo
-- de agrupamento 1:1; `niches_aplicaveis` é array, vazio = todos os nichos).
-- ============================================================================
create or replace function public.admin_fornecedores_by_categoria()
returns table (categoria text, total bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select f.categoria, count(*)
  from public.fornecedores_parceiros f
  where f.ativo = true
  group by f.categoria
  order by count(*) desc;
end;
$$;

revoke execute on function public.admin_fornecedores_by_categoria() from public;
grant execute on function public.admin_fornecedores_by_categoria() to authenticated;

-- ============================================================================
-- Funil da Jornada por fase — quantas jornadas têm ao menos 1 etapa concluída
-- em cada fase, sobre o total de jornadas iniciadas. `total_jornadas` repete
-- em toda linha (o client já tem tudo pra montar o funil sem query extra).
--
-- Ordem das fases é FIXA no código (mesma lista de `jornada_etapa_templates`
-- na migration 20260731160000_jornada_conclusao.sql, a mais recente a alterar
-- essa constraint) — a coluna `fase` do banco não guarda ordem entre fases
-- (`ordem` é só a ordem das etapas DENTRO da fase).
-- ============================================================================
create or replace function public.admin_jornada_funnel()
returns table (fase text, alcancaram bigint, total_jornadas bigint)
language plpgsql
security definer set search_path = public
as $$
declare
  total bigint;
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  select count(*) into total from public.jornada_instances;

  return query
  select t.fase, count(distinct je.jornada_instance_id), total
  from public.jornada_etapa_templates t
  join public.jornada_etapas je on je.etapa_template_id = t.id and je.status = 'concluida'
  group by t.fase;
end;
$$;

revoke execute on function public.admin_jornada_funnel() from public;
grant execute on function public.admin_jornada_funnel() to authenticated;

-- ============================================================================
-- Dicas da Mary mais acessadas (dado real via `dicas_acessos`, não proxy de
-- catálogo).
-- ============================================================================
create or replace function public.admin_dicas_ranking(limite int default 5)
returns table (material_id uuid, titulo text, categoria text, acessos bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select m.id, m.titulo, c.titulo, count(a.id)
  from public.dicas_acessos a
  join public.dicas_materiais m on m.id = a.material_id
  join public.dicas_categorias c on c.id = m.categoria_id
  group by m.id, m.titulo, c.titulo
  order by count(a.id) desc
  limit limite;
end;
$$;

revoke execute on function public.admin_dicas_ranking(int) from public;
grant execute on function public.admin_dicas_ranking(int) to authenticated;

-- ============================================================================
-- Uso de IA — totais gerais + comparativo 7 dias (mesmo formato jsonb de
-- `admin_dashboard_stats`, é o card único de KPI).
-- ============================================================================
create or replace function public.admin_ia_usage_totals()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'total_chamadas', (select count(*) from public.ia_usage_logs),
    'total_tokens', (select coalesce(sum(total_tokens), 0) from public.ia_usage_logs),
    'chamadas_7d', (select count(*) from public.ia_usage_logs where created_at > now() - interval '7 days'),
    'tokens_7d', (select coalesce(sum(total_tokens), 0) from public.ia_usage_logs where created_at > now() - interval '7 days')
  );
end;
$$;

revoke execute on function public.admin_ia_usage_totals() from public;
grant execute on function public.admin_ia_usage_totals() to authenticated;

-- ============================================================================
-- Uso de IA por dia — série temporal pro gráfico (padrão 14 dias).
-- ============================================================================
create or replace function public.admin_ia_usage_por_dia(dias int default 14)
returns table (dia date, chamadas bigint, tokens bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select d::date, count(l.id), coalesce(sum(l.total_tokens), 0)
  from generate_series(current_date - (dias - 1), current_date, interval '1 day') d
  left join public.ia_usage_logs l on date_trunc('day', l.created_at) = d
  group by d
  order by d;
end;
$$;

revoke execute on function public.admin_ia_usage_por_dia(int) from public;
grant execute on function public.admin_ia_usage_por_dia(int) to authenticated;

-- ============================================================================
-- Uso de IA por função (Edge Function) — qual fluxo consome mais token.
-- ============================================================================
create or replace function public.admin_ia_usage_por_funcao()
returns table (funcao text, chamadas bigint, tokens bigint)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.jwt() ->> 'user_role' != 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select l.funcao, count(*), coalesce(sum(l.total_tokens), 0)
  from public.ia_usage_logs l
  group by l.funcao
  order by coalesce(sum(l.total_tokens), 0) desc;
end;
$$;

revoke execute on function public.admin_ia_usage_por_funcao() from public;
grant execute on function public.admin_ia_usage_por_funcao() to authenticated;
