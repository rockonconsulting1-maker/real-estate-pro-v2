drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update their own avatar." on storage.objects;
drop policy if exists "Anyone can delete their own avatar." on storage.objects;

create policy "Users can upload their own avatar."
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Users can update their own avatar."
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Users can delete their own avatar."
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );