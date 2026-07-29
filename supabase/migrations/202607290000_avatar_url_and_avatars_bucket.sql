-- Ser Dono — Foto de perfil: coluna avatar_url + bucket de Storage (PRD §5.1)
-- Primeiro uso de Supabase Storage no projeto — RLS de storage.objects nasce
-- junto com o bucket na mesma migration (mesma disciplina da SPEC §4.1).

alter table public.users add column avatar_url text;

-- Bucket público pra leitura (foto de perfil não é dado sensível — precisa
-- ser exibível em qualquer tela sem sessão/signed URL), mas só o dono grava
-- no próprio caminho: convenção de path é "{user_id}/avatar.jpg", um arquivo
-- por usuário (upload sempre com upsert:true, sem acumular lixo no bucket).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Bucket público já serve objetos por URL direta sem passar pela policy de
-- SELECT (isso é o que "public: true" faz) — uma policy de select ampla
-- (bucket_id = 'avatars') só serviria pra permitir list() via API em
-- qualquer pasta, expondo nomes/IDs de usuário sem necessidade. Restringe a
-- própria pasta, então: dá pra listar/gerenciar o próprio arquivo via API,
-- mas não o de terceiros.
create policy "avatars_read_own" on storage.objects
  for select using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
