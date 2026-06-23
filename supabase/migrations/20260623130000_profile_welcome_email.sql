-- Onboarding welcome email — send-once guard.
--
-- Stamped when the "welcome to the team" email is sent after a member finishes
-- creating their profile. NULL = not sent yet, so a failed/dormant send simply
-- retries on the next onboarding finish. The user updates their own row via the
-- existing "users update own profile" policy; no new RLS needed.

alter table profiles
  add column if not exists welcome_email_sent_at timestamptz;
