-- STACK_BATCH6 Stage 2 — pinned groups on the combined Home.
-- An ordered list (up to 3, enforced in app code) of the user's pinned group ids.
alter table profiles
  add column if not exists pinned_groups uuid[] not null default '{}';
