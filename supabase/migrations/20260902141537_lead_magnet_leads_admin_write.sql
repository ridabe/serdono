-- Ser Dono — Painel Admin de leads do e-book (SDD-140).
--
-- A SDD-139 criou `lead_magnet_leads` só com leitura de admin — INSERT
-- fechado (só a Edge Function `lead-capturar` escreve). O Painel agora tem
-- uma tela pra listar/editar/excluir esses cadastros, então falta liberar
-- UPDATE e DELETE pro admin. INSERT continua fechado de propósito: lead
-- nasce pelo formulário público, ninguém cadastra à mão.

create policy "lead_magnet_leads_update_admin" on public.lead_magnet_leads
  for update using (auth.jwt() ->> 'user_role' = 'admin');

create policy "lead_magnet_leads_delete_admin" on public.lead_magnet_leads
  for delete using (auth.jwt() ->> 'user_role' = 'admin');
