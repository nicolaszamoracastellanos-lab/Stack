# Stack — Fix Batch: System, Bugs & Usage

> A focused round of bug fixes and system corrections, not new features. Save as `STACK_FIXES.md` in the project root and point Claude Code at it. Several of these are serious (duplicate groups, streak reset). Diagnose roots, do not patch symptoms.

---

## How to use this document

Save as `STACK_FIXES.md` in your project root. In Claude Code:

> Read STACK_FIXES.md in full. For each item, diagnose the root cause before fixing, and for the database bugs verify the actual query/data behavior rather than assuming. Use the Supabase CLI migration workflow for any schema/policy changes, keep everything bilingual EN/ES, and replace any generic error states you touch with the real error. Fix them one at a time and confirm each.

---

## 1. Bottom nav STILL drifts (highest priority, recurring)

The bottom navigation continues to move and sometimes floats to the middle of the screen on scroll, despite previous fixes. This keeps coming back, so diagnose it properly this time.

- The most common cause of a `position: fixed` element drifting is an ANCESTOR with a CSS `transform`, `filter`, `perspective`, `backdrop-filter`, or `will-change` property, which makes that ancestor the containing block instead of the viewport. Search the ENTIRE component tree above the nav for any of these (including Tailwind classes: `transform`, `scale-*`, `translate-*`, `rotate-*`, `blur-*`, `backdrop-blur-*`, `will-change-*`, and any animation/transition utilities that imply a transform). Report exactly which ancestor(s) have them.
- Fix so the nav is anchored to the viewport, not to any transformed ancestor: it must be `position: fixed` with `bottom: 0, left: 0, right: 0`, a high `z-index`, and NO transformed/filtered ancestor between it and the body. If a visual effect requires a transform/filter, move that effect off the nav's ancestor chain.
- Use `padding-bottom: env(safe-area-inset-bottom)` inside the nav for the iOS home indicator, and `min-height: 100dvh` (not 100vh) on the page container so Safari's toolbar showing/hiding does not move the layout.
- Add `padding-bottom` to scrollable content equal to nav height + safe-area inset so nothing hides behind it and there's no dead gap.
- Test with momentum scrolling on long pages (Groups, Profile, a long feed) on iOS Safari and confirm zero movement. Report the root cause you found before fixing.

## 2. Nudge needs a real function + must be dismissable

The nudge shows on Home and tapping it redirects to the group, which is good, but it has no real purpose yet and never goes away.

- Give the nudge a function: when a user is nudged, tapping the nudge takes them to the group AND clearly surfaces the call to action, check in. Land them somewhere that makes "take your photo now" the obvious next step (e.g., open the group with a prominent check-in prompt, or open the check-in flow directly for that group). The point of a nudge is to convert an at-risk member into a check-in.
- Make the nudge dismissable two ways: (a) when the user taps it and acts on it (or arrives at the destination), it clears from the Home tab; (b) an X next to the nudge dismisses it immediately. Once dismissed or acted upon, it does not reappear (persist the dismissed/read state, do not just hide it in local state that resets on refresh).
- If the same member is nudged again later (new day), a new nudge can appear; but a given nudge, once handled, stays gone.

## 3. Groups are duplicating (SERIOUS, likely same root cause as #7)

Groups appear multiple times: a 4-member group shows 4 times in the groups list, a 2-member group shows twice, and on a member's profile the shared group shows once per member too. The duplication count equals the member count, which is the signature of a broken JOIN.

- Diagnose: the query fetching a user's groups is almost certainly JOINing `groups` to `group_members` and returning one row per member instead of one row per group. Find that query (groups list, and the "shared groups" query on profiles).
- Fix at the root: the query should return DISTINCT groups (group by group id, or structure the query so each group appears exactly once regardless of member count). Do not deduplicate in the UI as a band-aid; fix the query so it returns the correct shape. The member count should be an aggregate (count of members), not a row multiplier.
- Verify against the real data: after the fix, a 4-member group appears exactly once in the list and once in shared groups, with "4 members" shown correctly.
- Check this same join pattern everywhere groups are listed (home group switcher, groups page, profile shared groups) since the bug likely repeats.

## 4. Delete a post / check-in

Users need to be able to delete their own check-in (e.g., remove a photo they posted).

- Add a delete action on a check-in, available only to the author of that check-in.
- Confirm before deleting (destructive), bilingual.
- On delete: remove the check-in and its photo from storage, remove its reactions and comments (cascade), and update any affected streak/consistency calculations and the feed in real time.
- Ensure RLS allows a user to delete only their own check-ins. Verify the policy.
- If a deleted check-in was the only one for that day, the streak/heatmap for that day must update correctly (this interacts with streak logic, handle it cleanly).

## 5. Invite by CODE, not just link

In the group page invite section, only the invite link is shareable. Add the code.

- Show the invite CODE prominently alongside the link, with its own copy button.
- The user can share either the full link or just the short code (for someone to enter manually in a "join by code" field).
- Confirm there is a "join by code" entry path on the join/groups screen where someone can type the code if they didn't get the link. If it doesn't exist, add it.

## 6. Tap to enlarge profile picture

On a member's profile (and your own), the avatar isn't tappable.

- Tapping the profile picture opens it larger in a simple modal/lightbox overlay (centered, dark backdrop).
- An X (and tapping the backdrop) closes it.
- Use the full-resolution avatar image. Keep it simple and clean, matching the dark aesthetic.

## 7. Streak logic: personal streak persists, group stats reset (SERIOUS)

When a user views themselves inside a newly joined group, their current streak shows 0. That's wrong. A personal streak belongs to the PERSON, not the group.

- Fix: a member's CURRENT STREAK and LONGEST STREAK and TOTAL CHECK-INS are personal and global to that user. They must show the user's real personal streak in every group, not reset to 0 on joining a new group. The streak comes from the user's overall check-in history, not from check-ins scoped to one group.
- What SHOULD reset/start from scratch when a group is created or joined is everything COLLECTIVE: the group's collective streak, the group's consistency % this week, the group's total check-ins, and any group-level aggregate. Those are correctly scoped to the group and start fresh.
- So: personal stats = global to the user, shown everywhere. Group stats = scoped to the group, start at zero. Make sure the leaderboard inside a group shows each member's correct personal current streak, while the group-level stats reflect only that group's activity.
- This likely shares a root with #3 (queries scoping personal data to a single group incorrectly). Check whether the streak query is filtering check-ins by group_id when it should be computing the personal streak across all the user's check-ins. Fix the query.
- Update lib/streaks.ts and its unit tests so personal streak is computed from all of a user's check-ins, and group collective streak is computed from that group's check-ins only.

## 8. Tour: add the "Install as an app" step + Safari tip

In the onboarding tour, teach users about installing the PWA, since that button exists but people don't know it.

- Add a tour step that points to / explains the "Install as an app" button, telling the user they can add Stack to their home screen for the full-screen app experience.
- In that step (or an adjacent one), recommend using Safari on iOS for the best experience and for the install-to-home-screen flow (Share -> Add to Home Screen). Keep it short and bilingual.
- Make sure this step fits naturally into the existing tour order and respects the same skip/next behavior.

## Acceptance

- The bottom nav stays locked to the bottom on every screen through momentum scrolling on iOS Safari, with the root cause identified and removed.
- A nudge converts to a check-in call-to-action, clears when acted on, and dismisses via X, persistently.
- Every group appears exactly once in the groups list, the home switcher, and profile shared groups, with a correct member count; the duplication is gone at the query level.
- A user can delete their own check-in with confirmation, and streaks/feed update correctly.
- The invite section shows both the link and the code, each copyable, with a join-by-code path.
- Tapping a profile picture opens an enlarged lightbox that closes with X or backdrop tap.
- Personal current/longest streak and total check-ins show the user's real global numbers in every group; only group-level collective stats start from zero.
- The tour includes an "Install as an app" step with a Safari recommendation.
- All changes bilingual, schema/policy changes via CLI migration, no silent error states in anything touched.

Built for Nico Zamora C.
