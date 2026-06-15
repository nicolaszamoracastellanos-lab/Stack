-- Structured workout check-in.
--
-- Multi-group posting model: ONE check-in row per selected group, all sharing a
-- post_id (see recommendation in the PR/commit). This keeps per-group feeds,
-- streaks, reactions, realtime filtering, and RLS working unchanged. The photo
-- is stored ONCE under the user's folder and authorized across every group that
-- references it.

alter table checkins add column if not exists sport text;
alter table checkins add column if not exists environment text;
alter table checkins add column if not exists goal text;
alter table checkins add column if not exists post_id uuid;

create index if not exists checkins_post_idx on checkins (post_id);

-- Photos now live under a per-USER folder: <user_id>/<filename>. That lets a
-- single uploaded photo back multiple group rows. Read access is granted to
-- members of ANY group that has a check-in referencing the photo. Matching on
-- photo_url means this also covers older <group_id>/<user_id>/<file> objects.
drop policy if exists "group members read checkin photos" on storage.objects;
create policy "group members read checkin photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checkins'
    and exists (
      select 1 from checkins c
      join group_members gm on gm.group_id = c.group_id
      where c.photo_url = name and gm.user_id = auth.uid()
    )
  );

-- Uploads go under the user's own folder.
drop policy if exists "authenticated upload checkins" on storage.objects;
create policy "authenticated upload checkins" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
