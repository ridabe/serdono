-- Ser Dono — Agendamento do cron de lembretes diários (pg_cron + pg_net,
-- habilitados na migration anterior). Roda todo dia às 12:00 UTC (09:00 em
-- São Paulo, horário padrão sem DST) e chama a Edge Function
-- `lembretes-diarios` via HTTP assíncrono.
--
-- A service_role key usada na Authorization NUNCA aparece em texto puro
-- aqui — vem do Vault (`vault.create_secret`, já rodado direto contra o
-- banco real fora de migration, pra não versionar segredo em git) via
-- `vault.decrypted_secrets`, resolvida em tempo de execução do cron.

select cron.schedule(
  'lembretes-diarios',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://klvmbytlqnvydjsauigy.supabase.co/functions/v1/lembretes-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'edge_functions_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
