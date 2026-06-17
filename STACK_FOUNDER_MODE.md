# STACK_FOUNDER_MODE — Founder/QA Testing Harness

**For:** Claude Code
**App:** Stack — private, small-group fitness accountability web app
**Stack:** Next.js + Supabase + Vercel. Bilingual EN/ES. Dark/intense theme, volt accent `#C6F806`.
**Live at:** stack-one-tawny.vercel.app
**Builds on:** all shipped batches through STACK_BATCH5 (solo mode, streak engine v2, tiers, web push notifications).

---

## 0. Goal

Give the founder a single, secure, founder-only place to **test everything without creating a new account each time**: onboarding/tour/instructions, the true new-user experience, all notification types, and every streak/tier state — while **never risking the founder's real data** (real streak, check-ins, groups).

This is an internal tool, not a user-facing feature. It must be invisible and inaccessible to all non-founder users.

---

## 1. Locked decisions (do not deviate without flagging)

1. **Access is gated by a database flag, server-enforced — never by a client-side email comparison.** Hiding UI in the browser is not security. Every founder action must be authorized on the server by checking the flag.
2. **Find the founder by email once, then use the flag.** The founder's account email is `nicolaszamoracastellanos@gmail.com`. Locate that user in Supabase `auth.users`, get their user id, and set `is_founder = true` on their `profiles` row. From then on, all gating uses the flag, not the email.
3. **Founder tools must only ever read/write the founder's OWN rows.** A test notification fires only to the founder's own devices. The streak simulator only edits the founder's own streak. Never mutate other real users' data, never blast a real group with test pushes.
4. **No destructive action without snapshot/undo.** Before any simulator change to the founder's streak/tier/onboarding state, capture a snapshot the founder can restore in one tap. The founder is a real daily user with a real streak; protect it.
5. **Prefer preview/render over data mutation.** To re-experience onboarding/tour/empty-states, default to a non-destructive preview render that does not change real data. A true "reset my onboarding" exists too, but it is secondary, clearly labeled, and never deletes check-ins/streak/groups.
6. **Flag-based, so it scales.** Build it so adding a future tester is just setting `is_founder = true` on another row. Do not hardcode the email anywhere except the one-time lookup migration.

---

## 2. Access control & data model

- Add `profiles.is_founder boolean NOT NULL DEFAULT false`.
- One-time migration/seed: look up the user id for `nicolaszamoracastellanos@gmail.com` in `auth.users`; set `is_founder = true` on that profile. If the user is not found, **stop and report** rather than guessing.
- **Server enforcement:**
  - All founder API routes / server actions begin by loading the current session user and verifying `is_founder = true`. If false, return 403. No exceptions.
  - RLS: founder tools must not require loosening existing RLS for normal users. If a tool needs elevated reads (e.g. environment/cron status), do it through a server action using the service role, *after* verifying `is_founder` server-side — never expose the service role to the client.
- **Client gating** (UI hiding) is layered on top for tidiness, but is never the security boundary. Hide the panel entry point unless `is_founder`.
- Optional extra guard: respect an env flag `FOUNDER_TOOLS_ENABLED` (default true) so the whole surface can be killed instantly if needed.

---

## 3. Entry point

- A **Founder** entry visible only to founder users — a small labeled item in Settings (and optionally a long-press on the wordmark) leading to `/founder`.
- `/founder` is a protected route: server-checks `is_founder` before rendering; redirects non-founders to home.
- The panel is clearly styled as an internal tool (e.g. a "FOUNDER / QA" header band) so it's never mistaken for a user feature.

---

## 4. Panel sections

### 4.1 Onboarding, tour & instructions (non-destructive first)
- **Preview new-user flow** — render, in a contained preview, each step without mutating real data:
  - Splash / "Show up. Every day." screen.
  - Required multi-step onboarding (username, photo, sport, etc.) in preview (inputs don't overwrite the real profile).
  - Welcome story + feature tour.
  - Tier Guide / instructions screen.
- **Preview empty states** — render the group-less new-user home, solo empty states, and the "Start a group / Join with a link" prompts, using throwaway preview data.
- **Replay (live, non-destructive):** buttons to actually re-trigger the splash, welcome story, and feature tour on the founder's real account WITHOUT resetting onboarding data (just flips the "seen" flags so they show again).
- **Full reset (secondary, guarded):** "Reset my onboarding state" — re-runs the real required onboarding on next load. Must NOT delete check-ins, streak, groups, or tier history. Snapshot first; confirm dialog spells out exactly what it does and doesn't touch.

### 4.2 Notifications (fire to founder's own device, on demand)
- **Status readout:** push permission state, whether a subscription exists, platform, and whether running as installed PWA (esp. iOS standalone). If push isn't possible (iOS Safari not installed), say so plainly here.
- **Fire each Batch 5 trigger type on demand**, delivered only to the founder's own subscriptions, with realistic sample payloads, localized to current language:
  1. Someone posted in your group
  2. Someone joined your group
  3. Group member logged a new workout/stack
  4. Late-day self-nudge ("still time to keep your streak")
  5. **At-risk: about to lose your streak**
  6. Member nudge
  7. Tier projection (up / down) and confirmed tier change
- **Trigger the time-based ones immediately** (evening nudge / at-risk / projection) without waiting for the GitHub Actions cron, by calling the same send function the cron calls, scoped to the founder.
- **Raw test push** button (arbitrary title/body) to sanity-check delivery.

### 4.3 Streak & tier simulator (snapshot-protected)
- **Snapshot / Restore** at the top of this section: "Snapshot my real state" and "Restore snapshot." Auto-snapshot before any change below.
- Controls (founder's own account only):
  - Set weekly goal `Q` (1–7).
  - Jump streak to N counting-days.
  - **Force at-risk state** (slack = 0) to verify the red alert icon + at-risk notification + the "how to save it" explainer.
  - Force streak-break to verify reset behavior.
  - Set **provisional** and **confirmed** tier to any of the 7 tiers to preview every badge: Gold 7×, Silver 6×, Volt 5×, Bronze 4×, Purple 3×, Amber 2×, Slate 1×. (Confirm red is used nowhere as a tier.)
  - Fire "trending up" / "trending down" projection notifications.
- **Read-out of live engine state:** current week (Mon–Sun, local tz), counting-days so far, workouts logged, banked rest remaining, slack, whether quota is still reachable. This is the fastest way to debug the engine.
- **Q=5 worked-example check:** a one-click that walks the spec's Q=5 scenario against the live engine and shows whether the streak breaks on the correct day. (Regression guard for the core mechanic.)

### 4.4 Seed & wipe demo data (founder-scoped, clearly fake)
- **Seed demo group:** create a throwaway group owned by the founder, populated with clearly-labeled fake members and sample check-ins/posts, so the feed, leaderboard, reactions/comments, nudges, chat, and story cards can be exercised solo.
- All seeded rows are tagged (e.g. `is_demo = true` or a known prefix) so they're unambiguous and bulk-deletable.
- **One-tap wipe:** "Delete all my demo data / restore snapshot" removes seeded data and leaves real data untouched.

### 4.5 Language
- Instant **EN / ES toggle** in the panel so every screen and notification can be checked in both languages without digging through settings.

### 4.6 Environment & build info
- Show: app build/commit (Vercel), environment, Supabase project ref, push/VAPID configured (yes/no), cron last-run timestamp and result, and the founder's user id + `is_founder` confirmation.
- Never print secrets — show presence/absence only (e.g. "VAPID: configured"), never the keys themselves.

---

## 5. Safety rails (enforce all)

- Every founder route/action verifies `is_founder` **server-side** before doing anything.
- All test writes are scoped to the founder's own user id. No tool can touch another user's rows.
- Test notifications go only to the founder's own devices.
- Snapshot before every destructive/simulator action; one-tap restore always available.
- Seeded demo data is tagged and bulk-deletable; never mixes with real data.
- Service role is used only in server actions behind the `is_founder` check; never shipped to the client.
- Do not weaken existing RLS for normal users to make any of this work.
- Nothing in this batch changes the real user experience for non-founders.

---

## 6. Don't break what's live

Solo mode, streak engine v2, tiers, web push, pacts, story cards, group chat, reactions/comments, streak forgiveness, leaderboard, recaps, onboarding tour — all must keep working unchanged for normal users.

---

## 7. QA checklist (run before calling it done)

- [ ] `is_founder` exists; founder account flagged true via email lookup; lookup failure is reported, not guessed.
- [ ] `/founder` renders for the founder and 403/redirects for everyone else (verified server-side, not just hidden).
- [ ] A non-founder cannot call any founder API route (returns 403) even if they know the URL.
- [ ] Preview new-user flow shows splash, onboarding, welcome story, tour, Tier Guide with NO change to real profile/streak/groups.
- [ ] Replay tour/story works live without resetting onboarding data.
- [ ] Full onboarding reset preserves check-ins, streak, groups, tier history (confirm dialog accurate).
- [ ] Each of the 7 notification types fires to the founder's own device, localized, with no leakage to real groups/users.
- [ ] Time-based notifications can be fired on demand without the cron.
- [ ] Simulator can set Q, jump streak, force at-risk (red icon appears), force break, and preview all 7 tier badges; red is used for no tier.
- [ ] Snapshot/restore reliably returns the founder's real streak/tier/onboarding state.
- [ ] Q=5 worked-example check passes (streak breaks on the correct day).
- [ ] Seed demo group works; one-tap wipe removes only demo data.
- [ ] EN/ES toggle flips all panel screens and sample notifications.
- [ ] Env/build readout shows status without exposing any secret values.
- [ ] No normal-user experience changed; existing features still work.

---

## 8. Build order

1. `is_founder` flag + email lookup migration + server-side gate + `/founder` route shell.
2. Environment/status readout (cheap, confirms wiring).
3. Notifications test section (highest day-to-day value).
4. Onboarding/tour preview + replay (non-destructive), then guarded full reset.
5. Streak/tier simulator with snapshot/restore + Q=5 check.
6. Seed/wipe demo data.
7. EN/ES toggle.

Ship and verify section by section; the panel is additive and founder-gated, so each section can land independently without risking the live app.
