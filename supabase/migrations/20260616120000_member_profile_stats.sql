-- Batch 2 · Section 1 — Tappable member profiles.
--
-- A member's hero stats (current streak, longest streak, total check-ins) and
-- heatmap should reflect their TRUE activity across all of their groups. Plain
-- RLS would only let a viewer see check-ins in the groups they personally share
-- with that member, undercounting the numbers.
--
-- This SECURITY DEFINER function returns one timestamp per POST (deduped by
-- post_id) for a member, but ONLY to a caller who already shares at least one
-- group with them (or to the member themselves). It exposes no photos or notes
-- — just the dates needed to compute streaks/heatmap — so it can read across
-- groups without leaking proof content from groups the viewer isn't in.
--
-- PHASE: Section 2 extends this to honor the `show_stats` privacy toggle.

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
      or exists (
        select 1
        from group_members me
        join group_members them on them.group_id = me.group_id
        where me.user_id = auth.uid()
          and them.user_id = _user_id
      )
    )
  order by coalesce(c.post_id, c.id), c.created_at desc;
$$;

grant execute on function public.member_checkin_dates(uuid) to authenticated;
