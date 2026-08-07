-- Ser Dono — Liberação automática de todos os módulos do catálogo no
-- cadastro (pedido do dono do produto em 07/08/2026). Até aqui, todo módulo
-- era 100% manual: o admin precisava ir em `user_modules` e ligar cada um
-- pra cada usuário novo (foi exatamente o que ele vinha fazendo à mão pra
-- praticamente toda conta criada, uma por uma).
--
-- Não muda nada do framework de módulos (SDD-30): continua existindo um
-- catálogo (`modules`) e uma liberação por usuário (`user_modules`), o admin
-- continua podendo ligar/desligar qualquer módulo pra qualquer pessoa a
-- qualquer momento (`AdminUserModulesScreen.tsx`/`setModuleAccess`, sem
-- alteração). Esta migration só troca o valor DEFAULT do que acontece no
-- instante em que uma conta passa a existir de verdade: em vez de nascer sem
-- nenhum módulo, nasce com todos os módulos do catálogo de hoje já ligados
-- (`habilitado = true`) — inclusive os que estiverem com `ativo = false` no
-- momento (não aparecem em `listMyModules` até o admin reativar o módulo em
-- si, mas a liberação por usuário já fica pronta, sem exigir uma segunda
-- ação do admin quando reativar).
--
-- ============================================================================
-- Por que gancho em `auth.users`, não em `public.users`: "cadastro" real
-- acontece de duas formas na base hoje, e só uma delas gera uma linha NOVA
-- em auth.users:
--   1. Sessão anônima (todo início de diagnóstico/"já tenho negócio" começa
--      assim) que vira conta de verdade via `supabase.auth.updateUser({email,
--      password})` — MESMA linha de auth.users, `is_anonymous` muda de
--      true pra false. Não dispara INSERT nenhum.
--   2. Sessão já não-anônima chamando `supabase.auth.signUp` (caminho
--      defensivo, raro) ou conta criada direto pelo dono do produto via
--      Admin API/painel do Supabase (SDD-67 menciona esse caso) — aí sim
--      nasce uma linha NOVA, já com `is_anonymous = false`.
-- Por isso dois triggers: um pro INSERT direto, outro pro UPDATE que troca
-- `is_anonymous` de true pra false. Cobre as duas origens sem depender de
-- nenhum campo específico do app (`onboarding_status` podia não ser tocado
-- em todo caminho, ex.: conta criada pelo admin que pula a etapa de cadastro
-- no fluxo "já tenho negócio", SDD-67).
-- ============================================================================
create or replace function public.grant_all_modules_to_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_modules (user_id, module_id, habilitado)
  select new.id, m.id, true
  from public.modules m
  on conflict (user_id, module_id) do nothing;
  return new;
end;
$$;

-- Conta nova já não-anônima desde o nascimento (signUp direto, criação pelo admin).
create trigger on_auth_user_created_grant_modules
  after insert on auth.users
  for each row
  when (new.is_anonymous is not true)
  execute function public.grant_all_modules_to_new_user();

-- Sessão anônima virando conta de verdade (caminho mais comum: cadastro via diagnóstico/"já tenho negócio").
create trigger on_auth_user_upgraded_grant_modules
  after update of is_anonymous on auth.users
  for each row
  when (old.is_anonymous is true and new.is_anonymous is not true)
  execute function public.grant_all_modules_to_new_user();

-- ============================================================================
-- Backfill: contas que já concluíram o cadastro antes desta migration (e-mail
-- real preenchido em `public.users`) e ainda não tinham algum módulo do
-- catálogo — mesmo critério do trigger acima, aplicado uma vez à base
-- existente. `on conflict do nothing` preserva qualquer `habilitado = false`
-- que o admin já tenha setado deliberadamente pra alguém.
-- ============================================================================
insert into public.user_modules (user_id, module_id, habilitado)
select u.id, m.id, true
from public.users u
cross join public.modules m
where u.email is not null
on conflict (user_id, module_id) do nothing;
