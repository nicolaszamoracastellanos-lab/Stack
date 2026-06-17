-- Stack — Fix batch migrations (apply once, in order). Idempotent.

-- ============================================================
-- 20260617120000_nudge_read
-- Fix #2 — persist when a nudge has been handled (acted on or dismissed) so it
-- doesn't reappear on refresh. A new nudge on a later day is a new row, so it
-- still surfaces; a handled one stays gone.

alter table nudges add column if not exists read_at timestamptz;

-- The recipient may mark their own received nudges as read.
drop policy if exists "recipient marks nudge read" on nudges;
create policy "recipient marks nudge read" on nudges
  for update using (to_user = auth.uid()) with check (to_user = auth.uid());

-- ============================================================
-- 20260617130000_checkin_delete
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

