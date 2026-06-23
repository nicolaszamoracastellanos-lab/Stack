-- Updates / newsletter waitlist.
--
-- Captures emails from the public landing page ("Be the first to know about our
-- updates"). Visitors are NOT authenticated, so anon may INSERT — but nobody
-- can read the list through the API (no SELECT/UPDATE/DELETE policy); reads and
-- the welcome-email send happen server-side via the service role, which bypasses
-- RLS. Email is unique + stored lowercased so a double sign-up is a no-op.

create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  language text,
  source text not null default 'landing',
  welcomed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

-- Public sign-up: anyone (incl. logged-out visitors) may add an email. There is
-- deliberately NO read policy — the list is server-role only.
drop policy if exists "anyone can join the waitlist" on waitlist;
create policy "anyone can join the waitlist" on waitlist
  for insert
  to anon, authenticated
  with check (true);
