-- Ser Dono — índice de `user_id` em `ia_usage_logs`/`dicas_acessos` (mesmo
-- padrão já usado em toda tabela de escrita frequente por usuário, ex.:
-- `retencao_clientes_user_idx`, `checkups_mensais_user_idx`). Faltou nas
-- duas migrations anteriores (20260811120000) — achado pelo advisor de
-- performance do Supabase logo depois de aplicar.
create index ia_usage_logs_user_idx on public.ia_usage_logs (user_id);
create index dicas_acessos_user_idx on public.dicas_acessos (user_id);
