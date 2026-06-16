-- Batch 3 · Section 5 — remember the user's check-in order and card template.
-- 'details' | 'photo' for the flow order; the card template key for sharing.
-- App code defaults these when the columns read undefined (pre-migration safe).

alter table profiles
  add column if not exists checkin_order text not null default 'details';
alter table profiles
  add column if not exists card_template text not null default 'minimal';
