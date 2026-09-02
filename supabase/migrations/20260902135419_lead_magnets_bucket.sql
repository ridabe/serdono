-- Ser Dono — Bucket público `lead-magnets` (SDD-138).
--
-- Iscas gratuitas de marketing (e-books, checklists, guias em PDF) servidas
-- por URL direta em landing pages e redes sociais — fora do produto, sem
-- login. Primeiro material: "Tudo o que você precisa saber para abrir um
-- negócio do zero" (material-de-apoio/ebook-abrir-negocio/).
--
-- Decisão do dono do produto (02/09/2026): o AbacatePay foi descartado como
-- canal — a API deles não permite produto gratuito (preço mínimo 1 centavo),
-- então a isca não cabe no modelo de "produto/checkout". O PDF é distribuído
-- direto daqui.
--
-- Mesmo raciocínio de `dicas-materiais` (SDD-59) e `parceiros-logos`
-- (SDD-51): material de marketing não é dado sensível, precisa ser baixável
-- por URL pública sem signed URL. Só admin grava; bucket público serve o
-- objeto direto, sem policy de select.

insert into storage.buckets (id, name, public)
values ('lead-magnets', 'lead-magnets', true)
on conflict (id) do nothing;

create policy "lead_magnets_storage_write_admin" on storage.objects
  for insert with check (bucket_id = 'lead-magnets' and auth.jwt() ->> 'user_role' = 'admin');

create policy "lead_magnets_storage_update_admin" on storage.objects
  for update using (bucket_id = 'lead-magnets' and auth.jwt() ->> 'user_role' = 'admin');

create policy "lead_magnets_storage_delete_admin" on storage.objects
  for delete using (bucket_id = 'lead-magnets' and auth.jwt() ->> 'user_role' = 'admin');
