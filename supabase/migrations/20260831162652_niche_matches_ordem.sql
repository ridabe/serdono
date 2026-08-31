-- Ser Dono — `niche_matches.ordem` (SDD-136).
--
-- A partir da SDD-136 quem ORDENA os 3 nichos da prévia é a IA (ranking por
-- perfil), não o `fit_score`. A tela precisa preservar essa ordem — antes ela
-- fazia `order by afinidade_direta, fit_score`, o que reembaralhava o ranking
-- da IA (um nicho #1 da IA com fit 85 caía atrás de um #2 com fit 88).

alter table public.niche_matches add column ordem smallint not null default 0;

comment on column public.niche_matches.ordem is
  'Posição na prévia (0 = melhor), definida pelo ranking da IA em diagnostic-match (SDD-136). A tela ordena por esta coluna, não por fit_score.';
