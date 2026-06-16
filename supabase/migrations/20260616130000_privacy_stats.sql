-- Batch 2 · Section 2 — Privacy: a single stats toggle.
--
-- `show_stats` defaults TRUE because mutual visibility is the whole point of an
-- accountability group. When a member turns it off, their streak/longest/total
-- are hidden from others (profile + leaderboard), but their name, avatar and
-- checked-in-today status stay visible — the privacy floor.

alter table profiles add column if not exists show_stats boolean not null default true;

-- Re-create the member stats RPC so it honors the toggle: a member with
-- show_stats = false returns NO rows to other viewers (so streak/total/heatmap
-- can't be reconstructed), while still returning rows to the member themselves.
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
        coalesce((select p.show_stats from profiles p where p.id = _user_id), true)
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
