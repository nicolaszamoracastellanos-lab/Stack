-- Native (iOS/Android) push tokens for the mobile app.
--
-- The web app stores web-push subscriptions (endpoint + p256dh + auth) in
-- `push_subscriptions` and sends via VAPID/web-push. Native devices instead
-- hand back an Expo push token (which fans out to APNs on iOS and FCM on
-- Android). Those are a different shape and a different send path, so they get
-- their own table. The send layer should union both when notifying a user.

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Expo push token, e.g. "ExponentPushToken[xxxxxxxx]".
  token text not null unique,
  -- "ios" | "android" (informational; the Expo API routes by token).
  platform text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

-- A user may only see / write / delete their own device tokens.
drop policy if exists "own device tokens: select" on public.device_push_tokens;
create policy "own device tokens: select"
  on public.device_push_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "own device tokens: insert" on public.device_push_tokens;
create policy "own device tokens: insert"
  on public.device_push_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "own device tokens: update" on public.device_push_tokens;
create policy "own device tokens: update"
  on public.device_push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own device tokens: delete" on public.device_push_tokens;
create policy "own device tokens: delete"
  on public.device_push_tokens for delete
  using (auth.uid() = user_id);
