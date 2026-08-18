-- Ser Dono — Capa de produto no Painel Admin AbacatePay (pedido do dono do
-- produto, 18/08/2026). A API da AbacatePay só aceita `imageUrl` (URL
-- pública), sem endpoint de upload de arquivo — mesmo caminho já usado pra
-- avatar/logo de parceiro: sobe pro Storage do próprio Ser Dono primeiro,
-- manda a URL pública pra AbacatePay depois.

insert into storage.buckets (id, name, public)
values ('abacatepay-produtos', 'abacatepay-produtos', true)
on conflict (id) do nothing;

create policy "abacatepay_produtos_write_admin" on storage.objects
  for insert with check (bucket_id = 'abacatepay-produtos' and auth.jwt() ->> 'user_role' = 'admin');

create policy "abacatepay_produtos_update_admin" on storage.objects
  for update using (bucket_id = 'abacatepay-produtos' and auth.jwt() ->> 'user_role' = 'admin');

create policy "abacatepay_produtos_delete_admin" on storage.objects
  for delete using (bucket_id = 'abacatepay-produtos' and auth.jwt() ->> 'user_role' = 'admin');
