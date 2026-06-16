-- Onboarding & tour flags. Default FALSE for everyone — including existing
-- accounts — so the next time any user logs in they get the welcome story once
-- and the feature tour once. Each flag flips true when its experience is
-- completed or skipped, so neither replays.
--
-- App code guards on `=== false` (not just falsy), so if this migration hasn't
-- been applied yet the columns read undefined and nobody gets trapped in a
-- redirect loop — onboarding simply stays dormant until the migration lands.

alter table profiles
  add column if not exists has_seen_welcome boolean not null default false;
alter table profiles
  add column if not exists has_completed_tour boolean not null default false;
