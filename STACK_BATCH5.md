# STACK_BATCH5 — Solo Mode, Streak Engine v2, Tiers & Notifications

**For:** Claude Code
**App:** Stack — private, small-group fitness accountability web app
**Stack:** Next.js + Supabase + Vercel. Bilingual EN/ES. Dark/intense theme, volt accent `#C6F806`.
**Live at:** stack-one-tawny.vercel.app
**This batch builds on:** STACK_SPEC, STACK_BRANDING, STACK_BATCH2, STACK_BATCH3, STACK_FIXES, STACK_ONBOARDING, STACK_BATCH4 (all shipped and live).

---

## 0. Read this first — scope, order, and locked decisions

This is a large batch. Build it in the order below. **The app must remain shippable and unbroken at the end of every stage**, so we ship foundation first and the riskiest piece (notifications) last. If we run out of week, we stop at a stage boundary and we're still live.

**Build order:**
1. **Stage A — Foundation:** selfie mirror fix, Monday-anchored weeks. (Low risk, fixes real bugs.)
2. **Stage B — Solo mode:** streaks/heatmap/tiers/profile all work with zero groups. (Solves cold-start.)
3. **Stage C — Streak Engine v2 + Tiers:** weekly-quota streaks, rest days, tier game, explainer screens. (Core mechanic.)
4. **Stage D — Notifications:** web push infra + triggers. (Highest risk; iOS caveat below.)

**Locked product decisions (do not deviate without flagging):**
- **NO public feed, NO public profiles, NO following.** Stack stays private-group-only by design. The cold-start problem is solved with Solo Mode + frictionless group creation, not a public network. If any task seems to require a public layer, stop and flag it.
- **Week = Monday 00:00 → Sunday 23:59:59, in the user's local timezone.** Always. Regardless of signup day. This is the anchor for streaks, quotas, rest days, recaps, everything.
- **Streak source of truth = weekly quota.** Preferred rest days are cosmetic/UX only (they drive smart prompts and nudges); they never protect or break a streak.
- **Existing streaks are converted, never reset.** Nobody loses their current streak number on migration.
- **Confirmed tier moves monthly (slow, symmetric). Weekly projections are notifications only.** The badge stays earned; the projections give weekly feedback.
- **Red is reserved exclusively for "at-risk / about to lose streak."** No tier uses red.

---

## STAGE A — FOUNDATION

### A1. Selfie mirror fix

**Problem:** When a user takes a check-in photo with the front (selfie) camera, the saved image is mirrored/flipped relative to what they expect, so text and asymmetry look wrong. This only happens on front-camera captures.

**Requirements:**
- Detect when the active camera is the front camera (`facingMode: 'user'`).
- The live preview may stay mirrored (natural selfie feel), but the **captured/stored image must be deterministic and not "weird."** Default the saved selfie to the **un-mirrored, true orientation** (what a normal photo would look like).
- After capture, on selfie shots only, show a **"Mirror" toggle** on the review/confirm screen so the user can flip the image horizontally back to the mirrored version if they prefer it. The toggle must visibly update the preview before posting.
- Persist the user's last choice as a per-user preference (`selfie_mirror_default`) so they don't re-toggle every time.
- Implement the flip with a deterministic canvas transform (`ctx.scale(-1, 1)` + adjusted draw), not CSS, so the stored file actually matches the choice.
- Back-camera captures are unaffected. Watermark and existing image-quality handling from Batch 3 must still apply after the flip.

**Acceptance:** A selfie check-in posts in the orientation shown on the confirm screen, the Mirror toggle flips it predictably, and the preference sticks across sessions.

### A2. Monday-anchored weeks (global)

**Problem:** Week boundaries may currently key off signup day or another anchor.

**Requirements:**
- Centralize week math in one utility (e.g. `lib/week.ts`): `getWeekStart(date, tz)`, `getWeekEnd(date, tz)`, `weeksBetween(...)`. Monday is day 0.
- All consumers (streak engine, heatmap "The Stack", weekly recap, quota counting, leaderboard period) use this utility. No ad-hoc week logic anywhere else.
- Compute in the **user's local timezone**, stored on the profile (`timezone`, default to browser `Intl.DateTimeFormat().resolvedOptions().timeZone` at onboarding; backfill existing users).
- Verify the weekly recap and any "this week" UI now reset on Monday local time.

**Acceptance:** A user who signs up on a Wednesday sees the current week as Mon–Sun, and "this week" counters reset Monday at local midnight.

---

## STAGE B — SOLO MODE

**Goal:** A user with **zero groups** gets full personal value on day one and an obvious path into a group. This is the cold-start fix.

### B1. Solo works everywhere
- Personal **streak**, **consistency ring**, and **heatmap ("The Stack")** all function with no group. A check-in with no group still counts toward the personal streak and history.
- Check-in flow works solo: you can post a check-in to "Just me" (personal log) with no group selected.
- Profile, tiers (Stage C), rest-day settings, and weekly recap all work solo.

### B2. Post-destination selector (replaces the dropped "public feed" idea)
On check-in, the user picks where it goes. Options:
- **All my groups** (posts to every group they're in)
- **Specific group(s)** (multi-select)
- **Just me** (personal log only; not shown to any group)

There is **no public option.** "Just me" is the private personal log, not a public feed. Default selection = the group(s) they posted to last time, or "Just me" if they have no groups.

### B3. Frictionless group entry (push, don't force)
- Onboarding and the empty-state home screen for group-less users surface **two large primary actions: "Start a group" and "Join with a link."**
- Starting a group is one short step (name + optional photo) and immediately generates an invite link (reuse existing invite-code/link system).
- Empty states must still show the user their own solo streak/heatmap so the app never feels dead, with a gentle recurring prompt: "Stack is better with your people. Start a group →". Show it, don't nag more than once per session.

**Acceptance:** A brand-new user who joins no group can check in, build a streak, see their heatmap and tier, and is clearly guided (not forced) toward creating/joining a group.

---

## STAGE C — STREAK ENGINE v2 + TIER GAME

This is the heart of the batch. Implement carefully; it's all edge cases.

### C1. Weekly quota model
- Each user sets a **weekly goal `Q`** = target workouts per week (1–7). This is their commitment.
- A week runs Mon–Sun local. **Allowed misses per week = `7 − Q`** ("banked rest days").
- A **counting day** = a day where the user logged a workout OR a day consumed as a banked rest day for that week. Both keep the streak alive.
- A workout = any logged check-in (any sport, including active rest like a walk/commute if the user logs it — logging is what counts).

### C2. Streak definition (the precise rule)
- Streak = **count of consecutive counting-days** with no break.
- The streak **breaks the moment hitting `Q` for the current week becomes mathematically impossible** — i.e. when `(days remaining in week) < (workouts still needed to reach Q)`. Not on a rest day, not on a skip with slack left. Only on impossibility.
- **At-risk state** (drives the red alert icon + notification): triggered when **slack = 0**, i.e. the user has used all `7 − Q` allowed misses and must train every remaining day this week to hit `Q`. One more miss breaks it.
- **Across week boundaries:** if a week's quota is met, the streak continues into Monday uninterrupted and the new week resets the allowance. A perfect week adds 7 counting-days (workouts + banked rest). This is why two people can both have a "20-day streak" — the **tier color** disambiguates how hard each is going (per the user's original requirement).

**Worked example (Q = 5):** Allowed misses = 2. User skips Mon + Tue (2 misses used, slack now 0 → red alert appears). User must train Wed–Sun. If they skip Wed, max reachable is 4 < 5 → **streak breaks on Wed.** Tapping the red icon explains: "You need to train every remaining day this week to keep your streak."

> **Note to Claude Code:** if any part of this rule proves illogical in implementation, stop and flag it. The goal is a rule that is *logical and easy to explain to a normal user*, not clever.

### C3. Rest days (cosmetic only)
- User may set **preferred rest days** (e.g. Sat/Sun). These are Mon–Sun only.
- Preferred rest days **do not** protect or break the streak — quota is the only source of truth. They power:
  - The **smart return prompt**: if the user didn't log on their preferred rest day(s), on next open show: *"You didn't log Sat/Sun. Were those your rest days?"* with Yes/No. (Informational; doesn't change streak math, but feels personal.)
  - Suppressing "you didn't work out" nudges on those days.

### C4. Tier system (the game)

**Tiers by weekly frequency (structure is locked by the user; colors below are final):**

| Frequency | Tier name | Color | Hex |
|---|---|---|---|
| 7×/week (every day) | Gold | warm gold | `#F5C518` |
| 6×/week | Silver | cool silver | `#C7CDD6` |
| 5×/week | **Volt** | Stack volt green | `#C6F806` |
| 4×/week | Bronze | bronze/copper | `#C77B3B` |
| 3×/week | Purple | purple | `#8B5CF6` |
| 2×/week | Amber | amber/yellow | `#F2B705` |
| 1×/week | Slate | dark slate (outlined) | `#3A4250` + 1px `#C6F806` outline |

Color notes (apply these):
- **Red is NOT used for any tier** — reserved for at-risk streak alerts only.
- **5× = volt green** is the brand color. There is a private rationale (Stack views ~5×/week as the ideal sustainable growth-without-overtraining pattern) that must **never appear in public-facing copy.** Do not surface it in UI, tooltips, or store text.
- **1× Slate**: pure black is invisible on the dark theme, so use dark slate with a thin volt outline so the badge is visible. (Keeps the user's "black = lowest" intent while remaining legible.)
- **2× Amber vs 7× Gold** are visually adjacent; keep Gold metallic/warm and Amber flatter, and always pair the badge with its tier name text so they're never confused.

**Earning and moving tiers:**
- Everyone **starts at level zero** (no confirmed tier).
- **Week 1 is special:** whatever frequency the user hits in their first week shows an **immediate provisional tier**, visually marked as provisional (outlined/desaturated badge + "Provisional" label). Instant gratification.
- A tier becomes **confirmed** only after a **full month (4 completed Mon–Sun weeks)**, based on the user's **average weekly frequency** over those weeks. Confirmed tier = the highest level proven across a completed month.
- **To climb:** complete a full month at the higher average frequency.
- **To drop (slow + symmetric):** a confirmed tier only steps down after a **full month whose average sits at a lower tier.** One bad week never drops a confirmed tier.
- **Weekly projections (notifications only, badge does not change weekly):**
  - Trending up: *"You're going harder than your goal — keep this up and you'll reach Silver."*
  - Trending down: *"This week was lighter. If it continues, your tier will step down to Purple."*
  These are forward-looking nudges; the confirmed badge changes only on the monthly cadence above.

### C5. Migration / conversion (no resets)
- **Preserve every existing user's current streak number** exactly.
- On first open after deploy, prompt each existing user to **set their weekly goal `Q`** (one-screen, skippable-with-default).
- Until `Q` is set, apply a **grace mode**: the streak cannot break due to quota (so migration never punishes anyone). Once `Q` is set, normal rules apply from the **next** Monday so we never break a streak mid-week on conversion.
- Default `Q` on conversion = most forgiving that won't punish them: set provisional `Q` to the lower of (their recent observed weekly average, if computable) or the lowest tier, and let them raise it. New users set `Q` during onboarding.

### C6. Explainer / teaching (required, EN + ES)
This system must be **taught, not just shipped.**
- A **Tier Guide screen** (accessible from profile): the table of tiers/colors/meanings, how streaks work, what the red alert means, how to climb/drop, what rest days do. Plain language.
- A short **onboarding addition** introducing goal-setting + tiers (3 cards max).
- A profile **legend**: each user's tier badge has a tap-through explaining "Gold = trains every day," etc., so viewers understand a 20-day Gold ≠ a 20-day Purple.
- Microcopy on the goal-setting screen explaining banked rest days in one sentence.

**Acceptance:** A new user can read the Tier Guide and correctly answer: when does my streak break, what does the red icon mean, how do I get from Purple to Volt, and do my rest days break my streak (no).

---

## STAGE D — NOTIFICATIONS

### D1. Honest platform constraint (must be handled, not hidden)
- **Web push on iOS only works if the user has installed Stack to the Home Screen as a PWA** (iOS 16.4+, standalone display mode). In iOS Safari without install, push is impossible — Apple's restriction, not ours.
- Therefore: detect capability. On iOS-Safari-not-installed, **don't show a broken "enable notifications" button** — instead show the existing install-as-app step and explain notifications unlock after install.
- Android and installed-PWA users (incl. installed iOS) get full web push.
- Build the push layer behind a thin abstraction (`lib/push/`) so the planned **Capacitor** native wrapper can later swap web push for FCM/APNs without touching trigger logic.

### D2. Infrastructure
- Service worker with Push API + VAPID keys (store keys in env/Vercel).
- Store subscriptions in Supabase (`push_subscriptions`: user_id, endpoint, keys, platform, created_at, last_seen). De-dupe by endpoint; prune dead endpoints on send failure.
- Send via a Supabase **edge function** or Next.js route invoked by triggers. Respect per-user quiet hours (default 22:00–08:00 local) and a per-type on/off in settings.
- All notification copy in **EN + ES**, localized to the user's language.

### D3. Triggers (build all)
1. **Someone posted in your group** — "{name} just stacked up in {group}."
2. **Someone joined your group** — "{name} joined {group}."
3. **New workout/stack logged by a group member** (their first of the day) — keep it to one per member per day to avoid spam.
4. **You haven't logged and it's late** — self-nudge, fired in the evening local time only if no check-in today AND today isn't a banked/preferred rest day. "Late in the day — still time to keep your streak."
5. **At-risk: about to lose your streak** — fires when slack hits 0 (C2). Pairs with the red alert icon next to the streak. Tapping explains exactly what's needed to save it.
6. **Member nudge** — let a group member send a nudge ("{name} nudged you to work out") — reuse existing nudge feature, now as a push.
7. **Tier projection** — weekly up/down projection (C4) and **confirmed tier change** ("You earned Volt 🟢").

> Dropped from the user's original list: follow-related notifications ("someone is now following you / can see your activity"), because following was cut. Do not build these.

### D4. Settings
- Per-type toggles, master toggle, quiet hours. Default master ON for installed/Android users after an in-context permission prompt (ask at a good moment, e.g. after first check-in, not on cold load).

**Acceptance:** On Android/installed PWA, all seven trigger types deliver correctly, localized, respect quiet hours and per-type toggles. On iOS-Safari-not-installed, the UI gracefully routes to install instead of offering a broken toggle.

---

## CROSS-CUTTING REQUIREMENTS

- **i18n:** every new string in EN + ES. No hardcoded English.
- **Theme:** dark/intense, volt `#C6F806` accent, consistent with existing components. Reuse existing badge/ring/heatmap components where possible.
- **Timezone correctness:** all date math via the Stage A week utility, user-local.
- **Capacitor-friendly:** no web-only assumptions that block a future native wrap; isolate push behind an interface.
- **Supabase data model additions (summary):** `profiles.weekly_goal`, `profiles.preferred_rest_days` (array 0–6), `profiles.timezone`, `profiles.selfie_mirror_default`, `profiles.tier_confirmed`, `profiles.tier_provisional`; `weekly_stats` (user_id, week_start, workouts_count, quota_met bool); `tier_history` (user_id, month_start, avg_frequency, tier); `push_subscriptions`; notification prefs on profile. Add RLS so users only read their own + their groups' data — **no cross-user public reads** (enforces the no-public-profile decision at the database level).
- **Don't break what's live:** pacts, story cards, group chat, reactions/comments, streak forgiveness, leaderboard, recaps, onboarding tour must all keep working.

## QA CHECKLIST (run before calling it done)
- [ ] Selfie posts in the orientation shown; Mirror toggle works; preference persists.
- [ ] Week is Mon–Sun in local tz for a Wed-signup user.
- [ ] Group-less user can check in, build a streak, see heatmap + provisional tier.
- [ ] Post-destination selector works (all groups / specific / just me); no public option exists anywhere.
- [ ] Streak breaks exactly at impossibility (replay the Q=5 worked example).
- [ ] Red alert icon appears exactly when slack = 0 and explains the save condition.
- [ ] Preferred rest days never change streak math; smart return prompt fires correctly.
- [ ] Existing user keeps their streak number through migration; grace mode prevents mid-week break.
- [ ] Provisional tier shows week 1; confirmed tier only moves on monthly cadence; never drops on one bad week.
- [ ] Tier Guide explains streak-break, red icon, climbing, and rest days, in EN + ES.
- [ ] All 7 notification types deliver on Android/installed; iOS-Safari-not-installed routes to install gracefully.
- [ ] No follow/public-profile code paths exist; RLS blocks cross-user reads.

---

## NOTE TO THE BUILDER (and to the user)
Ship stage by stage in the order above. After each stage, deploy and confirm green before starting the next. If the week runs out, stop at a stage boundary — the app stays fully live and better than before at every stop. The riskiest piece (notifications) is last on purpose. Do not let "transform the whole app" pressure push notifications ahead of a working streak engine.
