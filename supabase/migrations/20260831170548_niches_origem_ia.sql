-- Ser Dono — `niches.origem` + nicho gerado pela IA (SDD-137).
--
-- Pedido do dono do produto: o diagnóstico não pode ficar preso aos ~50
-- nichos da base. Se a pessoa descreve um ramo que não existe no catálogo
-- (cervejaria artesanal, escola de mergulho, corretora de seguros...), a IA
-- passa a PROPOR o nicho — com números ESTIMADOS, não pesquisa de mercado —
-- e ele é gravado aqui pra o Fit Score funcionar e pra outros usuários com a
-- mesma ideia reaproveitarem.
--
-- Exceção consciente à RN-20 (todo dado de mercado tem fonte): dado de nicho
-- gerado pela IA é permitido DESDE QUE rotulado. `origem = 'ia'` é o rótulo;
-- a tela de resultado e o /quanto-custa mostram "estimativa, não pesquisa" em
-- vez de "Fonte: Sebrae". Admin revisa em /admin/nichos e ou promove a
-- 'curado' (com fonte real) ou apaga.

alter table public.niches add column origem text not null default 'curado'
  check (origem in ('curado', 'ia'));

comment on column public.niches.origem is
  'curado = faixas de mercado com fonte (RN-20). ia = nicho proposto pela IA no diagnóstico quando nada no catálogo representava a ideia da pessoa; os números são ESTIMATIVA. Admin revisa em /admin/nichos (SDD-137).';

-- Índice parcial: a tela de admin lista só os `ia`, e são poucos.
create index niches_origem_ia_idx on public.niches (created_at desc) where origem = 'ia';
