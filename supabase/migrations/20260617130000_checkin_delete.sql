-- Fix #4 — authors can delete their own check-ins (and the photo).
-- Verified: checkins had SELECT + INSERT policies but NO delete policy, and
-- storage.objects had no delete policy for the checkins bucket, so deletes were
-- blocked at the DB. reactions + comments already cascade on checkin delete.

drop policy if exists "users delete own checkins" on checkins;
create policy "users delete own checkins" on checkins
  for delete using (auth.uid() = user_id);

-- A user may delete photos under their own folder in the private checkins bucket.
drop policy if exists "owners delete checkin photos" on storage.objects;
create policy "owners delete checkin photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
