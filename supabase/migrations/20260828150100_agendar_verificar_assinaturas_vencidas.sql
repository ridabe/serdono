-- Ser Dono — Agendamento do cron de inadimplência (pg_cron + pg_net, já
-- habilitados desde `20260808210000_push_notifications.sql`). Roda a cada 6
-- horas (mais frequente que o cron diário de lembretes — aqui atraso na
-- detecção significa atraso em avisar o usuário e em rebaixar/restaurar
-- acesso, não só um lembrete perdido) e chama a Edge Function
-- `assinatura-verificar-vencidas` via HTTP assíncrono.
--
-- Mesmo mecanismo de `20260808220000_agendar_lembretes_diarios.sql`: a
-- service_role key nunca aparece em texto puro aqui — vem do Vault
-- (`vault.decrypted_secrets`, secret `edge_functions_service_role_key` já
-- criado pro cron de lembretes, reaproveitado aqui).

select cron.schedule(
  'assinatura-verificar-vencidas',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://klvmbytlqnvydjsauigy.supabase.co/functions/v1/assinatura-verificar-vencidas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'edge_functions_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
