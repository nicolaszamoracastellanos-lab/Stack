-- Batch 5 · Stage B — Solo mode.
--
-- A check-in no longer requires a group: group_id NULL = a "Just me" personal
-- log, visible only to its author, never shown to any group. This is the
-- cold-start fix — full personal value (streak, heatmap, tiers) with zero
-- groups. There is deliberately NO public option; RLS keeps personal logs to
-- the author alone.

alter table checkins alter column group_id drop not null;

-- SELECT: group members read their group's check-ins; authors always read their
-- own (covers solo group_id IS NULL rows). No cross-user reads of personal logs.
drop policy if exists "members read group checkins" on checkins;
create policy "members read group checkins" on checkins
  for select using (
    public.is_group_member(group_id) or user_id = auth.uid()
  );

-- INSERT: you create your own, either solo (group_id IS NULL) or into a group
-- you actually belong to.
drop policy if exists "users create own checkins" on checkins;
create policy "users create own checkins" on checkins
  for insert with check (
    auth.uid() = user_id
    and (group_id is null or public.is_group_member(group_id))
  );

-- STORAGE: authors can read their own check-in photos directly (their folder),
-- so a solo check-in's photo is viewable without any group join to authorize it.
-- Group members keep their existing shared-group read path.
drop policy if exists "owners read own checkin photos" on storage.objects;
create policy "owners read own checkin photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The cross-group stats RPC must keep "Just me" logs private: a group-mate
-- viewing your profile sees your shared-group activity but NOT your solo posts
-- (not even as dates). The owner still sees everything, including solo.
create or replace function public.member_checkin_dates(_user_id uuid)
returns table (created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (coalesce(c.post_id, c.id)) c.created_at
  from checkins c
  where c.user_id = _user_id
    and (
      _user_id = auth.uid()
      or (
        c.group_id is not null
        and coalesce((select p.show_stats from profiles p where p.id = _user_id), true)
        and exists (
          select 1
          from group_members me
          join group_members them on them.group_id = me.group_id
          where me.user_id = auth.uid()
            and them.user_id = _user_id
        )
      )
    )
  order by coalesce(c.post_id, c.id), c.created_at desc;
$$;

grant execute on function public.member_checkin_dates(uuid) to authenticated;
