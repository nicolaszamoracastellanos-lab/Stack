-- STACK_BATCH6 Stage 3 — per-user per-group chat read marker.
-- Unread = messages from OTHERS created after last_read_at. Own-rows-only RLS.

create table if not exists group_chat_reads (
  user_id uuid references profiles(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

alter table group_chat_reads enable row level security;
drop policy if exists "manage own chat reads" on group_chat_reads;
create policy "manage own chat reads" on group_chat_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
