-- Fix #2 — persist when a nudge has been handled (acted on or dismissed) so it
-- doesn't reappear on refresh. A new nudge on a later day is a new row, so it
-- still surfaces; a handled one stays gone.

alter table nudges add column if not exists read_at timestamptz;

-- The recipient may mark their own received nudges as read.
drop policy if exists "recipient marks nudge read" on nudges;
create policy "recipient marks nudge read" on nudges
  for update using (to_user = auth.uid()) with check (to_user = auth.uid());
