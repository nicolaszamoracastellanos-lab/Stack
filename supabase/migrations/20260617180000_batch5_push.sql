-- Batch 5 · Stage D — Web push notifications.
--
-- Subscriptions live here; per-user notification prefs live on the profile.
-- Push is gated by capability + an installed PWA on iOS (Apple restriction) —
-- handled in the app, not hidden. Copy is localized to profiles.language at send
-- time. No cross-user reads: a user only sees their own subscriptions.

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  platform text,
  created_at timestamptz default now(),
  last_seen timestamptz default now(),
  unique (endpoint)
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;
drop policy if exists "read own subscriptions" on push_subscriptions;
drop policy if exists "write own subscriptions" on push_subscriptions;
create policy "read own subscriptions" on push_subscriptions
  for select using (user_id = auth.uid());
create policy "write own subscriptions" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Per-user notification prefs.
-- notif_master: master on/off. notif_types: jsonb map of type→bool (absent=on).
-- quiet hours in the user's LOCAL time (24h); default 22:00–08:00.
alter table profiles
  add column if not exists notif_master boolean not null default true;
alter table profiles
  add column if not exists notif_types jsonb not null default '{}'::jsonb;
alter table profiles
  add column if not exists quiet_start int not null default 22;
alter table profiles
  add column if not exists quiet_end int not null default 8;
-- Language for localized push copy (falls back to 'en'); set from the UI.
alter table profiles
  add column if not exists language text;
