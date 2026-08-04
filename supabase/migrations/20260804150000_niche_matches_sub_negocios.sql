-- Ser Dono — Sub-negócios destacados por match (SDD-66).
--
-- A tela de resultado (`ResultadoScreen.tsx`) lê `niche_matches`, não a
-- resposta da Edge Function — o fluxo normal é ler a tabela, e só invocar a
-- function quando não existe match salvo. Se os sub-negócios escolhidos pela
-- IA vivessem só na resposta HTTP, sumiriam no primeiro reload da página.
--
-- Guarda o que a IA ESCOLHEU e POR QUÊ, não o catálogo (que já está em
-- `niche_sub_negocios`): `[{ "nome": ..., "por_que": ... }]`. RN-38 — a IA
-- só ordena e explica itens do catálogo curado, nunca inventa um negócio;
-- persistir a escolha deixa isso auditável contra a tabela de origem.
alter table public.niche_matches
  add column sub_negocios_destaque jsonb not null default '[]'::jsonb;

comment on column public.niche_matches.sub_negocios_destaque is
  'Sub-negócios que a IA destacou para este usuário neste nicho, com a razão. Sempre um subconjunto de niche_sub_negocios (RN-38).';
