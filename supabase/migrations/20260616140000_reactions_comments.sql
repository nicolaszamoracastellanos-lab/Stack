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
