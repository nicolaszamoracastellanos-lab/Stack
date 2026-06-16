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
