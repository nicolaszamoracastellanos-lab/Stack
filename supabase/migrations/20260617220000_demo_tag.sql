-- Founder mode §6 — demo-data tagging.
--
-- Seeded founder demo data is tagged is_demo so it's unambiguous and bulk-
-- deletable, and never mixes with real data. Wipe deletes the demo GROUP, whose
-- cascade removes its members, check-ins, reactions and comments in one shot.
-- Default false, so nothing existing is affected.

alter table groups add column if not exists is_demo boolean not null default false;
alter table checkins add column if not exists is_demo boolean not null default false;
