-- Ser Dono — Logo do parceiro/fornecedor (pedido do dono do produto,
-- 31/07/2026). Mostrado ao empreendedor onde o parceiro já aparece hoje:
-- "Parceiros indicados pro seu nicho" (Fase Fornecedores) e "Quer um sistema
-- exclusivo?" (Fase Produto).

alter table public.fornecedores_parceiros add column logo_url text;

-- Bucket público pra leitura (mesmo raciocínio do bucket `avatars`, SDD da
-- foto de perfil: logo de parceiro não é dado sensível, precisa ser exibível
-- em qualquer tela sem sessão/signed URL) — só admin grava. "public: true"
-- já serve o objeto por URL direta sem passar por policy de SELECT, então
-- não criamos policy de leitura ampla aqui (mesmo motivo já documentado na
-- migration do bucket `avatars`: evitar `list()` exposto sem necessidade).
insert into storage.buckets (id, name, public)
values ('parceiros-logos', 'parceiros-logos', true)
on conflict (id) do nothing;

create policy "parceiros_logos_write_admin" on storage.objects
  for insert with check (bucket_id = 'parceiros-logos' and auth.jwt() ->> 'user_role' = 'admin');

create policy "parceiros_logos_update_admin" on storage.objects
  for update using (bucket_id = 'parceiros-logos' and auth.jwt() ->> 'user_role' = 'admin');

create policy "parceiros_logos_delete_admin" on storage.objects
  for delete using (bucket_id = 'parceiros-logos' and auth.jwt() ->> 'user_role' = 'admin');
