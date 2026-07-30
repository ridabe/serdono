drop policy "avatars_public_read" on storage.objects;

create policy "avatars_read_own" on storage.objects
  for select using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
