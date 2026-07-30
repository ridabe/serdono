-- Ser Dono — Grants padrão do Supabase (SDD-17)
--
-- As tabelas de 202607281300 foram aplicadas diretamente via SQL (fora do
-- fluxo `supabase db push`), o que pulou os GRANTs de default privileges que
-- o Supabase normalmente garante em todo projeto novo. Resultado: RLS estava
-- habilitada corretamente, mas nenhum papel (nem `service_role`) tinha
-- privilégio de SELECT/INSERT/UPDATE/DELETE nas tabelas — só `postgres`.
-- RLS não substitui GRANT: as duas camadas são exigidas juntas.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  public.users,
  public.diagnostic_responses,
  public.niches,
  public.niche_matches
to authenticated;

-- `anon` cobre a chave pública antes de qualquer sessão existir; RLS de cada
-- tabela (SDD-4/SDD-5) continua sendo a barreira real por linha.
grant select, insert, update, delete on
  public.users,
  public.diagnostic_responses,
  public.niches,
  public.niche_matches
to anon;

grant all privileges on
  public.users,
  public.diagnostic_responses,
  public.niches,
  public.niche_matches
to service_role;

-- Garante que qualquer tabela nova criada depois (via `supabase db push`
-- normal) já nasça com esses grants, sem depender de lembrar disso de novo.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon;

alter default privileges in schema public
  grant all privileges on tables to service_role;
