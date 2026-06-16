-- Batch 2 · Section 6 — Nudge an at-risk member.
--
-- A nudge is a one-tap "your group is waiting" poke to a member who hasn't
-- checked in today. Rate-limited to one per (from,to) per day via a stored
-- `day` column + unique constraint (an index expression on now() can't be used
-- because it isn't IMMUTABLE).

create table if not exists nudges (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  from_user uuid references profiles(id) on delete cascade not null,
  to_user uuid references profiles(id) on delete cascade not null,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz default now(),
  unique (from_user, to_user, day)
);
create index if not exists nudges_to_idx on nudges (to_user, created_at desc);

alter table nudges enable row level security;

drop policy if exists "read own nudges" on nudges;
drop policy if exists "send nudges" on nudges;

-- You can read nudges you received or sent (recipient banner + sender's
-- rate-limit check).
create policy "read own nudges" on nudges
  for select using (to_user = auth.uid() or from_user = auth.uid());

-- You can send a nudge as yourself to another member of a group you both
-- belong to.
create policy "send nudges" on nudges
  for insert with check (
    from_user = auth.uid()
    and from_user <> to_user
    and public.is_group_member(group_id)
    and exists (
      select 1 from group_members gm
      where gm.group_id = nudges.group_id and gm.user_id = to_user
    )
  );
