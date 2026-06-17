-- Batch 5 · Stage C — Streak Engine v2 + Tiers.
--
-- Quota is the streak source of truth (Mon–Sun weeks). Preferred rest days are
-- cosmetic (smart prompts only). Tiers are earned by weekly frequency and move
-- on a monthly cadence. Existing streaks are never reset: quota rules apply only
-- from quota_active_from (always a Monday), with grace before it.

alter table profiles
  add column if not exists weekly_goal int check (weekly_goal between 1 and 7);
alter table profiles
  add column if not exists quota_active_from date;
-- 0 = Monday … 6 = Sunday (preferred, cosmetic rest days).
alter table profiles
  add column if not exists preferred_rest_days int[] not null default '{}';
alter table profiles
  add column if not exists tier_confirmed text;
alter table profiles
  add column if not exists tier_provisional text;

-- Per-completed-week frequency (for projections + tier evaluation history).
create table if not exists weekly_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  week_start date not null,
  workouts_count int not null default 0,
  quota_met boolean not null default false,
  created_at timestamptz default now(),
  unique (user_id, week_start)
);
create index if not exists weekly_stats_user_idx on weekly_stats (user_id, week_start);

-- Confirmed-tier history, one row per evaluated month.
create table if not exists tier_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  month_start date not null,
  avg_frequency numeric not null,
  tier text not null,
  created_at timestamptz default now(),
  unique (user_id, month_start)
);
create index if not exists tier_history_user_idx on tier_history (user_id, month_start);

alter table weekly_stats enable row level security;
alter table tier_history enable row level security;

-- Own-only reads/writes (no cross-user public reads — enforces the privacy
-- decision at the DB level).
drop policy if exists "read own weekly stats" on weekly_stats;
drop policy if exists "write own weekly stats" on weekly_stats;
create policy "read own weekly stats" on weekly_stats
  for select using (user_id = auth.uid());
create policy "write own weekly stats" on weekly_stats
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "read own tier history" on tier_history;
drop policy if exists "write own tier history" on tier_history;
create policy "read own tier history" on tier_history
  for select using (user_id = auth.uid());
create policy "write own tier history" on tier_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
