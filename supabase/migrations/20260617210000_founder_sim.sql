-- Founder mode §4/§5 — streak simulation override (founder-only).
--
-- founder_sim is read by the streak context ONLY when the row is is_founder, so
-- it never affects normal users (the column stays null for everyone else). It
-- overrides the DISPLAYED streak count/state for visual QA (red at-risk icon,
-- badge, milestones) WITHOUT touching real check-ins — restore just clears it.
-- Shape: { "active": bool, "count": int, "state": "alive"|"at-risk"|"broken" }.

alter table profiles
  add column if not exists founder_sim jsonb;
