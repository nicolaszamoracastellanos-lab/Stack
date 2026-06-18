# STACK_FIXES2 — At-risk streak fix, tier badges, session persistence, group admin

**For:** Claude Code
**App:** Stack — private, small-group fitness accountability web app
**Stack:** Next.js + Supabase + Vercel. Bilingual EN/ES. Dark/intense theme, volt accent `#C6F806`.
**Live at:** stack-one-tawny.vercel.app
**Builds on:** all shipped batches through STACK_BATCH5 and STACK_FOUNDER_MODE.

**Standing rules (apply to everything below):** no em dashes in any copy; every new user-facing string in English AND Spanish; all schema changes via Supabase CLI migrations; never a silent error state; every destructive action needs a confirmation dialog.

This is a focused fix-and-small-feature batch. Two of these are live bugs affecting real daily users right now (A and C), so prioritize them. Build in the order A, B, C, D. Keep the app shippable at every step.

---

## A. Streak at-risk bug (live bug, top priority)

**Symptom (founder's real account):** weekly goal 6×/week, worked out Mon/Tue/Wed, today is Thursday (3 of 6 done), yet the app shows the "about to lose your streak" at-risk state. Per the Batch 5 rules this is wrong.

**Correct rule (restate from Batch 5, this is the source of truth):**
- Week = Monday 00:00 → Sunday 23:59:59 in the user's local timezone.
- Allowed misses per week = `7 − Q` (Q = weekly goal).
- "Days remaining in week" **includes today**.
- `slack = (days remaining incl. today) − (workouts still needed to reach Q)`.
- **At-risk fires only when `slack == 0`** (one more miss would make Q impossible).
- Streak breaks only when Q becomes impossible: `(days remaining) < (workouts still needed)`.

**Apply the rule to the founder's case to confirm the bug:** Q=6 → allowed misses = 1. Done 3, need 3 more. Days remaining incl. Thursday = 4 (Thu/Fri/Sat/Sun). slack = 4 − 3 = 1. So at-risk should be **false**. If the app shows at-risk, it's a bug.

**Diagnose first (use the founder engine-state readout):** print and inspect, for the founder's account: stored `weekly_goal`, `week_start`, `timezone`, workouts logged this week, days remaining incl. today, workouts still needed, computed slack, computed at_risk. The bug will be obvious from these numbers.

**Ranked likely causes (check in this order):**
1. **`weekly_goal` is not actually 6** (saved or defaulted to 7, or never persisted from onboarding). If Q=7, allowed misses = 0 and at-risk fires immediately at 3/3 Thursday. Verify the onboarding goal-setting actually writes `weekly_goal`, and fix the stored value.
2. **Off-by-one in the at-risk check** (treating `slack <= 1` as at-risk, or not counting today as an available day).
3. **Week not Monday-anchored or wrong timezone**, miscounting days remaining.
4. **Counting logic** that excludes today (a day with no log yet) from "days remaining."

Fix whichever applies. The fix may be data (correct the stored goal) and/or logic; address both if both are wrong.

**Add a regression test** reproducing the exact case: Q=6, logged Mon/Tue/Wed, evaluated on Thursday → expect `at_risk == false`, `slack == 1`, streak alive. Then: skip Thursday, evaluate Friday → expect `at_risk == true`, `slack == 0`. Then: skip Friday → expect streak broken.

**Partial first-week rule (new, implement generally):** a user who joins mid-week must NOT be able to break their streak or be shown at-risk during that first partial week. The real weekly quota applies starting their first full Monday. (The founder started on a Monday so this doesn't affect his case, but implement it for all future mid-week joiners.)

**Verify in production** on the founder account after deploy: at 3/3 on Thursday with Q=6, no at-risk indicator.

---

## B. Tier badge surfacing

**Problem:** the tier status from Batch 5 isn't visible anywhere. Most likely the **provisional** tier rendering was never wired up (confirmed tiers require a full month, so a 3-day-old account only has a provisional tier to show).

**Requirements:**
- **Show the provisional tier from week 1**, visually marked as provisional (outlined or desaturated badge + "Provisional" label), so a brand-new user sees their tier immediately.
- **Place a colored tier badge right next to the member's name** in:
  - the group **member list**,
  - **feed posts** (next to the poster's name),
  - the **leaderboard**,
  - the **profile** screen.
- Badge = the tier color swatch + short tier name. Use the locked Batch 5 palette: Gold (7×) `#F5C518`, Silver (6×) `#C7CDD6`, Volt (5×) `#C6F806`, Bronze (4×) `#C77B3B`, Purple (3×) `#8B5CF6`, Amber (2×) `#F2B705`, Slate (1×) `#3A4250` with a thin `#C6F806` outline. **Red is used for no tier** (reserved for at-risk).
- Tapping a badge opens the tier explainer/legend so viewers understand that, e.g., Gold means trains every day, so a 20-day Gold streak ≠ a 20-day Purple streak.
- EN/ES for all labels.

**Acceptance:** the founder (3 days in) sees his provisional tier badge next to his name in his group's member list and feed, with the correct color, and tapping it explains the system.

---

## C. Session persistence + push resilience (live bug)

**Problem:** users get logged out when they close the app and have to log in again every time. This is bad on its own and is a plausible reason push notifications aren't being received (a churned session can orphan or fail to register the push subscription). Note: this is a plausible cause, not confirmed; the steps below both fix the session and isolate the notification issue.

**Session fixes:**
- Ensure the Supabase client uses `persistSession: true` and `autoRefreshToken: true`.
- Session must be stored somewhere that **survives the PWA being closed** (persistent localStorage/IndexedDB, not in-memory and not a session-only cookie). If using `@supabase/ssr`, ensure auth cookies are persistent with a real `maxAge`, not session cookies that die on close.
- Refresh the session on app focus / `visibilitychange` so a returning user is silently re-authed via refresh token rather than bounced to login.
- Target: an installed-PWA user (and ideally a browser user) stays logged in across closes for the normal refresh-token lifetime.

**Push resilience:**
- On every app load with a valid session, ensure a push subscription exists and **upsert it tied to the user id**, de-duped by endpoint. Do not create duplicates on each login.
- Do not delete the subscription on logout in a way that orphans future delivery; re-sync on next login.
- **Diagnostic path:** use the founder panel "send test push to myself" to confirm the delivery pipeline works independently of triggers. Then have another real user post in a shared group and confirm the trigger fires. This isolates whether the problem is delivery, subscription, or trigger.

**Acceptance:** founder stays logged in after closing and reopening the installed app; the founder test push arrives; a real group member's post produces a push.

---

## D. Group admin: creator-only remove member

**Requirements:**
- Each group has an explicit owner (the creator). If `groups.owner_id` doesn't already exist, add it and backfill it to each group's creator.
- **Only the owner can remove a member.** Enforce this **server-side** (server action / RLS), not just by hiding the UI button. A non-owner attempting removal gets denied.
- Removal flow: a remove control on each member (visible only to the owner) → confirmation dialog (destructive action) → member removed.
- **On removal (default behavior, flag if you want it changed):** revoke the member's access so they can no longer view or post in the group going forward; **keep their historical posts** in the group feed (do not delete, so the group's history and others' context stay intact).
- The removed member: the group disappears from their list; no errors or broken screens anywhere they previously saw it.
- The owner cannot remove themselves through this control. (Leaving a group, transferring ownership, and deleting a group are out of scope for this batch; note them as future work.)
- EN/ES copy; no silent errors; confirmation required.

**Acceptance:** the group creator can remove a member with a confirmation; a non-owner cannot (server-denied); the removed member loses access cleanly while their past posts remain.

---

## QA checklist (run before done)

- [ ] Founder at 3/3 Thursday with Q=6 shows NO at-risk; engine readout shows slack=1.
- [ ] Regression test passes: Q=6 Mon/Tue/Wed → Thu not at-risk; skip Thu → Fri at-risk; skip Fri → broken.
- [ ] Mid-week joiner cannot break streak or show at-risk in their first partial week.
- [ ] Provisional tier badge shows from week 1, correct color, next to names in member list, feed, leaderboard, profile; tap opens explainer; red used for no tier.
- [ ] Installed PWA stays logged in across close/reopen; session refreshes on focus.
- [ ] Founder test push arrives; a real member's post triggers a push; no duplicate subscriptions.
- [ ] Only the group owner can remove a member (server-enforced); confirmation required; removed member loses access cleanly; historical posts kept.
- [ ] All new copy in EN + ES; no em dashes; no silent errors.

## Build order
A (streak at-risk) → C (session/push) → B (tier badges) → D (group admin). A and C are live bugs, do them first. Deploy and verify each before the next.
