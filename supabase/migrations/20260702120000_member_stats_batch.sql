-- Batch variants of the per-member stats RPCs (elevation pass).
--
-- WHY: group detail called member_checkin_dates + member_rest_days once per
-- member (2N round-trips per group view). These take an array of user ids and
-- return everything in one call each, tagged by user_id.
--
-- ADDITIVE ONLY: the single-user RPCs stay; nothing is dropped or renamed.
-- Rollback: drop function public.member_checkin_dates_batch(uuid[]);
--           drop function public.member_rest_days_batch(uuid[]);
--
-- NOT applied to production by the elevation pass — review and run manually,
-- then switch lib/group-detail.ts to the batch calls (see the flag in the
-- elevation report).

create or replace function public.member_checkin_dates_batch(_user_ids uuid[])
returns table (user_id uuid, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select c.user_id, c.created_at
  from (
    select distinct on (ch.user_id, coalesce(ch.post_id, ch.id))
      ch.user_id, ch.created_at
    from checkins ch
    where ch.user_id = any (_user_ids)
    order by ch.user_id, coalesce(ch.post_id, ch.id), ch.created_at desc
  ) c
  where
    -- Same privacy floor as member_checkin_dates: yourself always; others only
    -- when they share a group with you AND have show_stats on.
    c.user_id = auth.uid()
    or (
      coalesce((select p.show_stats from profiles p where p.id = c.user_id), true)
      and exists (
        select 1
        from group_members me
        join group_members them on them.group_id = me.group_id
        where me.user_id = auth.uid()
          and them.user_id = c.user_id
      )
    );
$$;

grant execute on function public.member_checkin_dates_batch(uuid[]) to authenticated;

create or replace function public.member_rest_days_batch(_user_ids uuid[])
returns table (user_id uuid, day date)
language sql
security definer
set search_path = public
stable
as $$
  select r.user_id, r.day
  from rest_days r
  where r.user_id = any (_user_ids)
    and (
      r.user_id = auth.uid()
      or (
        coalesce((select p.show_stats from profiles p where p.id = r.user_id), true)
        and exists (
          select 1
          from group_members me
          join group_members them on them.group_id = me.group_id
          where me.user_id = auth.uid()
            and them.user_id = r.user_id
        )
      )
    );
$$;

grant execute on function public.member_rest_days_batch(uuid[]) to authenticated;
