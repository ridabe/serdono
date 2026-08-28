-- Ser Dono — Correção de um bug real encontrado testando
-- `assinatura-verificar-vencidas` (28/08/2026): o secret do Vault usado
-- pelos dois cron jobs pra autenticar a chamada à Edge Function
-- (`edge_functions_service_role_key`) estava desatualizado — TODA chamada
-- (inclusive `lembretes-diarios`, rodando todo dia desde 08/08/2026) vinha
-- devolvendo 401 e sendo ignorada silenciosamente, sem nenhum alerta visível
-- disso (confirmado inspecionando `net._http_response` direto).
--
-- Corrigido trocando por um secret novo, dedicado só a isso —
-- `cron_auth_token` — que nunca é a service_role key de verdade (higiene
-- melhor: um token vazado aqui não dá acesso amplo ao banco, só chama estas
-- 2 functions). O valor em si NUNCA entra em migration (mesmo motivo já
-- documentado em `20260808220000_agendar_lembretes_diarios.sql`): rodado
-- direto contra o banco real fora de migration via
-- `vault.create_secret(...)`, e setado como secret de Edge Function
-- (`CRON_AUTH_TOKEN`) via `supabase secrets set`. Esta migration só
-- reaponta os 2 jobs existentes pro novo secret — nenhum segredo aqui.

select cron.alter_job(
  (select jobid from cron.job where jobname = 'lembretes-diarios'),
  command := $$
  select net.http_post(
    url := 'https://klvmbytlqnvydjsauigy.supabase.co/functions/v1/lembretes-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_auth_token')
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'assinatura-verificar-vencidas'),
  command := $$
  select net.http_post(
    url := 'https://klvmbytlqnvydjsauigy.supabase.co/functions/v1/assinatura-verificar-vencidas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_auth_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
