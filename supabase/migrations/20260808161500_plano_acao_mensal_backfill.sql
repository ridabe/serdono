-- Ser Dono — Backfill: usuários que já tinham conta antes do módulo
-- "Plano de Ação Mensal" existir também ganham ele liberado.
--
-- O trigger de auto-liberação (`20260807140000_auto_liberar_modulos_no_cadastro.sql`)
-- só dispara em CADASTRO NOVO (INSERT/upgrade de sessão anônima em
-- auth.users) — um módulo inserido depois em `public.modules` não chega
-- retroativamente em quem já tinha conta. Achado testando esta sessão: o
-- módulo não aparecia em `/modulos` pro usuário de teste, que existe desde
-- antes de hoje. Mesmo critério do backfill original, restrito a este
-- módulo (não reaplica os demais, que já foram cobertos naquela migration).
insert into public.user_modules (user_id, module_id, habilitado)
select u.id, m.id, true
from public.users u
cross join public.modules m
where m.slug = 'plano-acao-mensal'
on conflict (user_id, module_id) do nothing;
