-- Ser Dono — Cortesia de módulo por admin (pedido do dono do produto,
-- 28/08/2026): liberar um módulo específico pra um usuário mesmo que o
-- plano dele não contemple, e poder revogar quando quiser.
--
-- Achado ao revisar o pedido: `user_modules.habilitado` já existe e a tela
-- `AdminUserModulesScreen.tsx` já dizia "Liberação independe do plano" —
-- mas isso nunca foi verdade de fato (`packages/supabase/modules.ts` só usa
-- `habilitado` como filtro ADITIVO ao gate de plano, nunca como substituto
-- dele; `bloqueado` em `listMyModules` é calculado só a partir de
-- `plano_minimo` x `plano_atual`, sem olhar pra `habilitado`). Esta coluna é
-- o que faltava pra aquele texto virar verdade — `habilitado` continua
-- controlando se o módulo existe pro usuário (independente de plano);
-- `cortesia` é o que passa por cima do gate de plano quando `true`.
alter table public.user_modules add column cortesia boolean not null default false;

comment on column public.user_modules.cortesia is
  'Quando true, o módulo aparece liberado pro usuário mesmo que o plano atual não atenda modules.plano_minimo — concedido/revogado manualmente pelo admin em AdminUserModulesScreen.tsx, nunca pelo próprio usuário (RLS de user_modules já restringe escrita a admin).';
