-- Batch 4 — Group Pacts: identity, rules, stakes ledger, rule-change proposals.
-- Honor system only: the app TRACKS who owes what; no real money is held,
-- moved, or processed. // FUTURE: real money hooks live in app code, not here.

-- ----------------------------------------------------------------------------
-- 1. Identity (optional) + 2. Pact rules — columns on groups (all nullable).
-- A group is a "pact" once workouts_per_week is set; identity is independent.
-- ----------------------------------------------------------------------------
alter table groups add column if not exists intention text;
alter table groups add column if not exists motivation text;
alter table groups add column if not exists end_goal text;
alter table groups add column if not exists meaning text;

alter table groups add column if not exists workouts_per_week int;
-- Sport keys that count toward the pact; empty = ALL disciplines count.
alter table groups add column if not exists allowed_disciplines text[] not null default '{}';
-- 'fixed' | 'ongoing'
alter table groups add column if not exists duration_type text;
alter table groups add column if not exists duration_weeks int;
alter table groups add column if not exists pact_start_date date;
alter table groups add column if not exists pact_end_date date;
-- 'money' | 'favor' | 'custom' | null (no stake)
alter table groups add column if not exists stake_type text;
alter table groups add column if not exists stake_value text;
-- 'breaker' | 'any_misser' | 'last_place' | null
alter table groups add column if not exists who_pays text;

-- groups had no UPDATE policy — the creator (admin) needs it to edit the pact.
drop policy if exists "creator updates group" on groups;
create policy "creator updates group" on groups
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Stakes ledger — honor-system debts.
-- ----------------------------------------------------------------------------
create table if not exists stakes_ledger (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  debtor_user uuid references profiles(id) on delete cascade not null,
  -- null = owed to the whole group.
  owed_to uuid references profiles(id) on delete set null,
  reason text not null,
  stake_description text not null,
  -- 'outstanding' | 'settled'
  status text not null default 'outstanding',
  -- Dedupe: one debt per debtor per group per period key (e.g. week start).
  period_key text,
  created_at timestamptz default now(),
  settled_at timestamptz,
  settled_by uuid references profiles(id) on delete set null,
  unique (group_id, debtor_user, period_key)
);
create index if not exists stakes_ledger_group_idx on stakes_ledger (group_id, status, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Rule-change proposals — unanimous approval.
-- ----------------------------------------------------------------------------
create table if not exists rule_change_proposals (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  proposed_by uuid references profiles(id) on delete cascade not null,
  -- The proposed new rule values (partial groups row).
  proposed_changes jsonb not null,
  summary text,
  -- Member ids who have approved (the proposer auto-approves on create).
  approvals uuid[] not null default '{}',
  -- 'pending' | 'approved' | 'rejected'
  status text not null default 'pending',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
create index if not exists proposals_group_idx on rule_change_proposals (group_id, status, created_at desc);

-- ----------------------------------------------------------------------------
-- RLS — group members only.
-- ----------------------------------------------------------------------------
alter table stakes_ledger enable row level security;
alter table rule_change_proposals enable row level security;

drop policy if exists "members read ledger" on stakes_ledger;
drop policy if exists "members write ledger" on stakes_ledger;
drop policy if exists "members update ledger" on stakes_ledger;
create policy "members read ledger" on stakes_ledger
  for select using (public.is_group_member(group_id));
create policy "members write ledger" on stakes_ledger
  for insert with check (public.is_group_member(group_id));
create policy "members update ledger" on stakes_ledger
  for update using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists "members read proposals" on rule_change_proposals;
drop policy if exists "members create proposals" on rule_change_proposals;
drop policy if exists "members update proposals" on rule_change_proposals;
create policy "members read proposals" on rule_change_proposals
  for select using (public.is_group_member(group_id));
create policy "members create proposals" on rule_change_proposals
  for insert with check (
    proposed_by = auth.uid() and public.is_group_member(group_id)
  );
create policy "members update proposals" on rule_change_proposals
  for update using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

-- Rule changes apply to the groups row only on unanimous approval; the existing
-- groups UPDATE path is the creator. // FUTURE: a SECURITY DEFINER apply-fn so
-- any member can commit an approved change. For now the admin applies it.

-- Live updates for the ledger + proposals (same realtime pattern as the feed).
do $$
begin
  begin alter publication supabase_realtime add table stakes_ledger; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table rule_change_proposals; exception when duplicate_object then null; end;
end $$;
