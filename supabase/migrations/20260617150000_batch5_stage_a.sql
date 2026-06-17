-- Batch 5 · Stage A — foundation columns.
--
-- timezone: the user's IANA timezone, captured at onboarding (browser
--   Intl.DateTimeFormat) and backfilled for existing users on next app load.
--   Anchors Monday-weeks, quiet hours, and evening nudges to the user's frame.
-- selfie_mirror_default: per-user preference for whether a check-in photo posts
--   mirrored. Default false = the un-mirrored, true orientation (what a normal
--   photo looks like); the user can flip it on the review screen.
-- App code defaults these when the columns read undefined (pre-migration safe).

alter table profiles
  add column if not exists timezone text;
alter table profiles
  add column if not exists selfie_mirror_default boolean not null default false;
