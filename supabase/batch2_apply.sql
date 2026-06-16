-- Stack — Batch 2 combined migrations (apply once, in order).
-- Safe to re-run: every statement is idempotent / guarded.

-- ============================================================
-- 20260616120000_member_profile_stats
-- ============================================================
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

-- ============================================================
-- 20260616130000_privacy_stats
-- ============================================================
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

-- ============================================================
-- 20260616140000_reactions_comments
-- ============================================================
-- Batch 2 · Section 5 — reactions (multi-emoji) + comments.

-- Let a member react with multiple distinct emojis on one check-in (previously
-- one reaction per member). Swap the unique key from (checkin_id,user_id) to
-- (checkin_id,user_id,emoji).
alter table reactions drop constraint if exists reactions_checkin_id_user_id_key;
do $$
begin
  alter table reactions
    add constraint reactions_checkin_user_emoji_key
    unique (checkin_id, user_id, emoji);
exception when duplicate_object then null;
end $$;

-- Comments: a lightweight, non-nested thread under each check-in.
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  checkin_id uuid references checkins(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_checkin_idx on comments (checkin_id, created_at);

alter table comments enable row level security;

drop policy if exists "members read comments" on comments;
drop policy if exists "members create own comments" on comments;
drop policy if exists "authors delete own comments" on comments;

-- Read: any member of the check-in's group. Write: the author, and only on a
-- check-in in a group they belong to. Delete: the author only.
create policy "members read comments" on comments
  for select using (
    public.is_group_member((select c.group_id from checkins c where c.id = checkin_id))
  );
create policy "members create own comments" on comments
  for insert with check (
    auth.uid() = user_id
    and public.is_group_member((select c.group_id from checkins c where c.id = checkin_id))
  );
create policy "authors delete own comments" on comments
  for delete using (auth.uid() = user_id);

-- Live comments, same as the feed.
do $$
begin
  alter publication supabase_realtime add table comments;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 20260616150000_nudges
-- ============================================================
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

-- ============================================================
-- 20260616160000_messages
-- ============================================================
-- Batch 2 · Section 8 — Group chat. A minimal real-time text channel per group.

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists messages_group_idx on messages (group_id, created_at);

alter table messages enable row level security;

drop policy if exists "members read messages" on messages;
drop policy if exists "members send messages" on messages;
drop policy if exists "authors delete own messages" on messages;

create policy "members read messages" on messages
  for select using (public.is_group_member(group_id));
create policy "members send messages" on messages
  for insert with check (
    auth.uid() = user_id and public.is_group_member(group_id)
  );
create policy "authors delete own messages" on messages
  for delete using (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 20260616170000_rest_days
-- ============================================================
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

