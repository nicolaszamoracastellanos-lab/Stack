-- Founder/QA harness (STACK_FOUNDER_MODE) — access flag + one-time seed.
--
-- Adds the server-enforced gate column and flags the founder account by a
-- ONE-TIME email lookup. The email appears ONLY here (locked decision #6); all
-- runtime gating uses is_founder, never the email. Self-guarding: if the user
-- isn't found, this raises and changes nothing — no guessing, no row created.

alter table profiles
  add column if not exists is_founder boolean not null default false;

do $$
declare
  founder_id uuid;
  updated int;
begin
  select id into founder_id
  from auth.users
  where lower(email) = 'nicolaszamoracastellanos@gmail.com'
  limit 1;

  if founder_id is null then
    raise exception
      'FOUNDER LOOKUP FAILED: no auth.users row for that email. Stopping — not guessing, not creating.';
  end if;

  update profiles set is_founder = true where id = founder_id;
  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception
      'FOUNDER FOUND (auth.users id=%) but no profiles row exists to flag. Stopping.', founder_id;
  end if;

  raise notice 'OK — founder flagged. user_id=%', founder_id;
end $$;
