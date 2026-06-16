-- Batch 2 · Section 9 — Streak forgiveness (rest days).
--
-- A user marks a specific day as a planned rest day. The streak engine treats a
-- rest day as a BRIDGE: it doesn't break the streak and doesn't inflate the
-- count. Chosen over a "freeze bank" because it maps cleanly onto the calendar
-- and the heatmap, and reads as an intentional plan rather than a spent token.

create table if not exists rest_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  day date not null,
  created_at timestamptz default now(),
  unique (user_id, day)
);
create index if not exists rest_days_user_idx on rest_days (user_id, day);

alter table rest_days enable row level security;

drop policy if exists "read own rest days" on rest_days;
drop policy if exists "insert own rest days" on rest_days;
drop policy if exists "delete own rest days" on rest_days;

create policy "read own rest days" on rest_days
  for select using (user_id = auth.uid());
create policy "insert own rest days" on rest_days
  for insert with check (user_id = auth.uid());
create policy "delete own rest days" on rest_days
  for delete using (user_id = auth.uid());

-- Gated rest days for member profiles (heatmap), privacy-aware exactly like
-- member_checkin_dates: only to the member or to a viewer who shares a group
-- and whose stats aren't hidden.
create or replace function public.member_rest_days(_user_id uuid)
returns table (day date)
language sql
security definer
set search_path = public
stable
as $$
  select r.day
  from rest_days r
  where r.user_id = _user_id
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
    );
$$;

grant execute on function public.member_rest_days(uuid) to authenticated;
