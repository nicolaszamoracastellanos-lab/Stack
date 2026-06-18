-- STACK_BATCH6 Stage 1 — unified notifications.
--
-- ONE table backs BOTH the in-app notification center AND push. Every notifiable
-- event inserts one row here; push is sent from that same row. Rows are written
-- server-side by the service role (notify()), so there is no client INSERT
-- policy. A user can only read/update their OWN rows.

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  actor_id uuid references profiles(id) on delete set null,
  group_id uuid references groups(id) on delete cascade,
  target_type text,
  target_id uuid,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_idx
  on notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on notifications (recipient_id) where read_at is null;

alter table notifications enable row level security;

-- Recipient-only access. No cross-user reads. No client insert (service role
-- writes via notify(); it bypasses RLS).
drop policy if exists "read own notifications" on notifications;
drop policy if exists "update own notifications" on notifications;
create policy "read own notifications" on notifications
  for select using (recipient_id = auth.uid());
create policy "update own notifications" on notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Live unread badge: stream inserts to the recipient (RLS still applies).
do $$
begin
  begin
    alter publication supabase_realtime add table notifications;
  exception when duplicate_object then null;
  end;
end $$;
