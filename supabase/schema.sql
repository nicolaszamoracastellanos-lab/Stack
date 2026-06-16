-- ============================================================================
-- Stack — Phase 1 schema
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is idempotent enough to re-run during development (drops policies first).
--
-- DEVIATIONS FROM THE SPEC SQL (intentional, and why):
--   1. RLS recursion fix. The spec's `group_members` SELECT policy queries
--      `group_members` from inside a policy ON `group_members`, which Postgres
--      rejects at runtime with "infinite recursion detected in policy for
--      relation group_members". We move the membership test into a
--      SECURITY DEFINER function `is_group_member()` that bypasses RLS, so the
--      policy no longer re-enters itself. Same security intent, but it works.
--   2. Invite-join read path. With members-only read on `groups`, a user
--      following an invite link can't read the group to preview/join it (they
--      aren't a member yet). We add a SECURITY DEFINER RPC
--      `group_by_invite_code()` that returns only id/name/goal for a valid
--      code. Membership read on `groups` otherwise stays members-only.
--   3. Creator read on `groups` (created_by = auth.uid()) so the creator can
--      read back the row they just inserted before the membership row exists.
--   4. Tightened insert checks: a checkin/reaction insert also verifies the
--      author is a member of the relevant group, not just that user_id = self.
--
-- PROFILE CREATION: handled in the /onboarding flow (an authenticated insert
-- into `profiles`), NOT a signup trigger. Username is required + unique and is
-- only known at onboarding, so a trigger at auth.signUp time has nothing to
-- write. This keeps Phase 1 free of Edge Functions / service-role triggers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  favorite_sport text,
  usual_activity text,
  focus_sport text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Identity fields added after the initial release; idempotent for existing DBs.
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists favorite_sport text;
alter table profiles add column if not exists usual_activity text;
alter table profiles add column if not exists focus_sport text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists show_stats boolean not null default true;
alter table profiles add column if not exists has_seen_welcome boolean not null default false;
alter table profiles add column if not exists has_completed_tour boolean not null default false;

create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  goal text,
  invite_code text unique not null,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

create table if not exists checkins (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  photo_url text not null,
  note text,
  sport text,
  environment text,
  goal text,
  post_id uuid,
  created_at timestamptz default now()
);

-- Structured-workout fields, added after the initial release (idempotent).
alter table checkins add column if not exists sport text;
alter table checkins add column if not exists environment text;
alter table checkins add column if not exists goal text;
alter table checkins add column if not exists post_id uuid;
create index if not exists checkins_post_idx on checkins (post_id);

create table if not exists reactions (
  id uuid default gen_random_uuid() primary key,
  checkin_id uuid references checkins(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  emoji text default 'fire',
  created_at timestamptz default now(),
  -- Multiple distinct emojis per member per check-in (Batch 2 §5).
  unique (checkin_id, user_id, emoji)
);

create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  checkin_id uuid references checkins(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_checkin_idx on comments (checkin_id, created_at);

-- Nudges (Batch 2 §6): one-tap "your group is waiting" pokes, rate-limited to
-- one per (from,to) per day.
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

-- Group chat messages (Batch 2 §8).
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists messages_group_idx on messages (group_id, created_at);

-- Rest days (Batch 2 §9): a planned day off that bridges the streak.
create table if not exists rest_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  day date not null,
  created_at timestamptz default now(),
  unique (user_id, day)
);
create index if not exists rest_days_user_idx on rest_days (user_id, day);

-- Helpful indexes for the feed / streak queries.
create index if not exists checkins_group_created_idx on checkins (group_id, created_at desc);
create index if not exists checkins_user_created_idx on checkins (user_id, created_at desc);
create index if not exists group_members_user_idx on group_members (user_id);
create index if not exists reactions_checkin_idx on reactions (checkin_id);

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER HELPERS (break the RLS recursion; enable the invite flow)
-- ----------------------------------------------------------------------------

-- True if the current user belongs to the given group. SECURITY DEFINER means
-- it reads group_members WITHOUT triggering that table's RLS, so policies can
-- call it without recursing.
create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = _group_id and user_id = auth.uid()
  );
$$;

-- Group lookup for the invite flow. Returns only the public-facing fields for a
-- valid code so a non-member can preview and then join.
create or replace function public.group_by_invite_code(_code text)
returns table (id uuid, name text, goal text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.goal
  from groups g
  where g.invite_code = upper(_code)
  limit 1;
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.group_by_invite_code(text) to authenticated;

-- Member hero stats across ALL of a member's groups (Batch 2 · Section 1).
-- Returns one timestamp per POST (deduped by post_id) for computing a member's
-- streaks/heatmap/total, but only to a caller who shares a group with them (or
-- the member themselves). No photos/notes are exposed — just dates — so this is
-- safe to read cross-group. SECURITY DEFINER bypasses RLS; the explicit
-- shares-a-group gate is the access control.
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

-- Gated rest days for member-profile heatmaps (Batch 2 §9), privacy-aware like
-- member_checkin_dates.
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

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table checkins enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table nudges enable row level security;
alter table messages enable row level security;
alter table rest_days enable row level security;

-- Drop existing policies so this file can be re-run cleanly in dev.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','groups','group_members','checkins','reactions','comments','nudges','messages','rest_days')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PROFILES: any authenticated user can read; you edit only your own.
create policy "profiles readable by authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);
create policy "users insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- GROUPS: members (or the creator) can read; any authenticated user can create.
create policy "members read their groups" on groups
  for select using (
    created_by = auth.uid() or public.is_group_member(id)
  );
create policy "authenticated create groups" on groups
  for insert with check (auth.uid() = created_by);
-- Only the creator can delete a group (cascades to members/checkins/reactions).
create policy "creator deletes group" on groups
  for delete using (auth.uid() = created_by);

-- GROUP MEMBERS: read membership of groups you belong to; you can join (as you).
create policy "read membership of own groups" on group_members
  for select using (public.is_group_member(group_id));
create policy "users join groups" on group_members
  for insert with check (auth.uid() = user_id);
-- You can leave a group by removing your own membership row.
create policy "users leave groups" on group_members
  for delete using (auth.uid() = user_id);

-- CHECKINS: members read all checkins in their group; you create your own (and
-- only in a group you actually belong to).
create policy "members read group checkins" on checkins
  for select using (public.is_group_member(group_id));
create policy "users create own checkins" on checkins
  for insert with check (
    auth.uid() = user_id and public.is_group_member(group_id)
  );

-- REACTIONS: readable by members of the checkin's group; you create/delete your
-- own, and only on checkins in a group you belong to.
create policy "members read reactions" on reactions
  for select using (
    public.is_group_member((select c.group_id from checkins c where c.id = checkin_id))
  );
create policy "users create own reactions" on reactions
  for insert with check (
    auth.uid() = user_id
    and public.is_group_member((select c.group_id from checkins c where c.id = checkin_id))
  );
create policy "users delete own reactions" on reactions
  for delete using (auth.uid() = user_id);

-- COMMENTS: readable by members of the checkin's group; authors create their
-- own (only in a group they belong to) and delete their own.
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

-- NUDGES: read ones you sent or received; send as yourself to another member of
-- a shared group.
create policy "read own nudges" on nudges
  for select using (to_user = auth.uid() or from_user = auth.uid());
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

-- MESSAGES (group chat): members read/send in their group; authors delete own.
create policy "members read messages" on messages
  for select using (public.is_group_member(group_id));
create policy "members send messages" on messages
  for insert with check (
    auth.uid() = user_id and public.is_group_member(group_id)
  );
create policy "authors delete own messages" on messages
  for delete using (auth.uid() = user_id);

-- REST DAYS: a user manages only their own.
create policy "read own rest days" on rest_days
  for select using (user_id = auth.uid());
create policy "insert own rest days" on rest_days
  for insert with check (user_id = auth.uid());
create policy "delete own rest days" on rest_days
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- REALTIME
-- Add the feed tables to the realtime publication so the home feed updates
-- live without a refresh.
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table checkins;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table reactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table messages;
  exception when duplicate_object then null;
  end;
end $$;

-- ----------------------------------------------------------------------------
-- STORAGE: private `checkins` bucket for proof photos.
-- Object path convention: <group_id>/<user_id>/<filename>
--   foldername()[1] = group_id, foldername()[2] = user_id
-- TRADEOFF: bucket is private, so the feed must display photos via short-lived
-- SIGNED URLs (see lib/storage.ts). A public bucket would be simpler but would
-- leak proof photos to anyone with the URL — not acceptable even in Phase 1.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', false)
on conflict (id) do nothing;

drop policy if exists "authenticated upload checkins" on storage.objects;
drop policy if exists "group members read checkin photos" on storage.objects;

-- Upload: an authenticated user may write only under their own user folder
-- (<user_id>/<filename>) so one photo can back a multi-group post.
create policy "authenticated upload checkins" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: a member of ANY group that has a check-in referencing this photo may
-- read it (supports multi-group posting; also covers legacy paths via photo_url).
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

-- ----------------------------------------------------------------------------
-- STORAGE: public `avatars` bucket for profile pictures.
-- Path convention: <user_id>/<filename>. Profile pictures aren't sensitive
-- proof photos, so this bucket is public-read (no signing needed in the feed),
-- but a user may only write under their own folder.
-- ----------------------------------------------------------------------------
-- Force public on conflict so an existing private/misconfigured bucket is fixed.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatar public read" on storage.objects;
drop policy if exists "avatar uploads by owner" on storage.objects;
drop policy if exists "avatar updates by owner" on storage.objects;

create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar uploads by owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar updates by owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
