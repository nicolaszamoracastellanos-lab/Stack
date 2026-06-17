-- Founder mode §2 — tiny key/value store for internal status (e.g. cron last-run).
--
-- RLS is ON with NO policies, so normal anon/auth clients can neither read nor
-- write it. Only the service-role admin client (used by the cron writer and the
-- founder-gated env readout, after the server-side is_founder check) touches it.
-- This keeps founder tooling status off-limits to regular users by default.

create table if not exists kv_meta (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table kv_meta enable row level security;
