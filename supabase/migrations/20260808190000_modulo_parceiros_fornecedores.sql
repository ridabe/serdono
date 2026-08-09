-- Ser Dono — Módulo "Parceiros e Fornecedores" (pedido do dono do produto
-- em 08/08/2026). Sexto módulo do catálogo. Nenhuma tabela nova: reaproveita
-- `public.fornecedores_parceiros`, já existente desde a Fase 8 da Jornada
-- (SDD-41) — RLS de leitura já é `authenticated` livre
-- (`fornecedores_parceiros_read_all`), então nenhuma policy nova é
-- necessária, só uma tela nova consumindo o mesmo dado sem gate de fase.

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'parceiros-fornecedores',
  'Parceiros e Fornecedores',
  'Nossa base de parceiros e fornecedores recomendados — filtre por categoria e fale direto com quem você escolher.',
  6,
  true
)
on conflict (slug) do nothing;

-- Backfill (premissa da SDD-87): sem isso, ninguém que já tinha conta antes
-- de hoje veria o pop-up de novidade desse módulo na Início.
insert into public.user_modules (user_id, module_id, habilitado, novidade_vista)
select u.id, m.id, true, false
from public.users u cross join public.modules m
where m.slug = 'parceiros-fornecedores'
on conflict (user_id, module_id) do update set novidade_vista = false;
