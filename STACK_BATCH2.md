# Stack — Update Batch 2: Master Build Spec

> The next major layer of Stack, grounded in competitor research (Strava, WHOOP, GymRats, Sweatmates, Apple Fitness, Duolingo). Save this file as `STACK_BATCH2.md` in the project root and point Claude Code at it.

---

## How to use this document

Save as `STACK_BATCH2.md` in your project root. Then in Claude Code:

> Read STACK_BATCH2.md in full. Build it in the order written, section by section, confirming each section works before moving to the next. Use the existing design tokens, the existing i18n system (every new string must be EN and ES), and the Supabase CLI migration workflow for all schema changes. Show me each major screen before wiring the next.

Build priority is top to bottom. Sections 1-4 are the core requested features and ship first. Sections 5-8 are the high-impact accountability additions. Section 9 is forgiveness and polish.

---

## Guiding principles (apply to everything below)

- **Accountability over vanity.** Stack's edge is private small-group consistency, not public performance. Every feature should make showing up (or not) more visible to your group, not chase competitive leaderboards.
- **Lean, not loud.** Research is clear that piling on badges and gamification backfires past a point. Add mechanics with restraint. No meaningless badges.
- **Mobile-first and consistent.** Match the dark intense aesthetic and the volt accent. Every new string bilingual. Every destructive or irreversible action shows a confirm and a real error on failure, never a silent fail.
- **Privacy floor.** Even when a member hides their stats, the group can still see whether they checked in today. Accountability never fully hides.

---

## 1. Tappable member profiles

Right now names in the feed and leaderboard are not tappable. Make every member's name and avatar (in the feed, the leaderboard, and the group member list) tap into that member's profile.

The member profile screen, in this exact vertical order:
1. Avatar, display name, username, and the short bio/status line.
2. A three-up hero stat row: Current streak (with the flame, volt), Longest streak, Total check-ins. These are the hero numbers, they go first.
3. The check-in history heatmap ("The Stack") for that member (see Section 3 for the corrected heatmap).
4. A grid of that member's recent check-in photos (most recent first, capped at a reasonable number like 30).
5. The groups you share with that member.

Your own profile uses the same layout. Reachable both from the nav and by tapping your own name anywhere.

This matches how Strava, WHOOP, and GymRats structure a viewable profile: hero stats, then history visualization, then recent proof-of-work.

## 2. Privacy: a single stats toggle

Add one privacy control in profile settings: "Show my stats to group members" (EN) / "Mostrar mis estadísticas a los miembros del grupo" (ES). A single on/off toggle. Default ON, because mutual visibility is the entire point of an accountability group.

Behavior when OFF:
- The member's current streak, longest streak, and total check-ins are hidden on their profile (show a subtle "Stats hidden" state to other viewers).
- Their numeric streak and ranking are hidden on the group leaderboard.
- BUT their name, avatar, and their checked-in-today / at-risk status remain visible to the group. This is the privacy floor: you can always see WHETHER someone showed up today, never hidden, even if the magnitude of their stats is private.
- The member always sees their own full stats.

Show a plain-language line under the toggle explaining exactly what group members will and will not see. Hide hidden data consistently everywhere, no partial leakage into aggregates.

## 3. Fix the check-in history heatmap

The current heatmap shows a full year and is hard to read. Rebuild it.

- Default view: the past 3 months (about 13 columns of 7-day weeks). Far more legible on a phone.
- Add a segmented toggle: 3M | 1Y. The 1Y view may scroll horizontally or shrink cells; never cram 52 weeks at full cell size.
- Use a threshold color scale, not a continuous gradient: a few discrete steps from the dark base color up to bright volt, GitHub-style. Discrete shades read far better than a rainbow or smooth gradient.
- Include a "Less -> More" legend.
- Label the months along the top and show weekday labels (at least alternating rows) down the side.
- Tapping or hovering a cell shows a tooltip with the exact date and the state (checked in, rest day, or missed).
- Never rely on color alone to convey state, since red-green color blindness affects a meaningful share of users. Use the tooltip and intensity, and make sure states are distinguishable beyond hue.
- Keep the label "The Stack" and the line "Every day you showed up."

## 4. Collapsible group cards + dedicated group detail pages

The Groups page currently shows every group fully expanded, which eats the whole screen. Fix both the list and add real group pages.

**Collapsed group card (the list):**
- Each group shows as a compact row: group avatar/color, name, one-line description, and one compact signal (the collective streak or your own at-risk status for that group), plus a caret icon.
- The full row is tappable. Tapping navigates to that group's detail page (do not expand a huge block inline). Use a caret because users expect it for expand/navigate.
- Keep the "Create a group" and "Join a group" actions at the bottom.
- Result: a clean, scannable directory of all your groups, each one line.

**Group detail page (new):** Two clearly separated sections, equal billing.

Section A, group-level stats (the "cool things to look at"):
- Collective streak (flame + day count): consecutive days every member checked in.
- Total group check-ins: this week and all-time.
- Group consistency % this week (the group analog of the personal consistency ring).
- Most consistent member this week (a positive callout, not a punishment ranking).
- A time framing toggle where it makes sense: This week (default) / Month / All-time, mirroring WHOOP team leaderboards.

Section B, per-member breakdown:
- The roster / leaderboard: each row shows avatar, name, current streak, a small consistency ring, and the at-risk red dot for anyone who has not checked in today.
- Each row taps into that member's profile (Section 1).
- Respect the privacy toggle (Section 2): hidden-stat members still show name, avatar, and at-risk status.

Also on the group detail page: the group's invite link with copy, and the Leave / Delete actions (creator-only delete), moved here from the list so the list stays clean.

## 5. Reactions and comments on check-ins

The feed is currently one-directional. Make it a reciprocity loop, the single biggest functional gap versus every competitor.

- Add emoji reactions to each check-in (start with a small set: fire, clap, flex/muscle, plus one or two more). Tap to react, tap to remove. Reactions show with a count and who reacted. Real-time via Supabase subscriptions.
- Add short text comments on each check-in, shown beneath it, real-time. Keep it lightweight, a simple threaded list, no nesting.
- The existing reactions table can extend to support the emoji set; add a comments table (id, checkin_id, user_id, body, created_at) with RLS so only group members of that check-in's group can read and only the author can write/delete their own.

## 6. Nudge an at-risk member

The most on-niche feature Stack is missing (Sweatmates ships exactly this). 

- On the leaderboard / member list, any member showing the at-risk red dot (has not checked in today) gets a one-tap "Nudge" action available to other members.
- A nudge sends that member a notification (in-app now; push later) like "Nico nudged you. Your group is waiting." Keep the copy friendly and a little cheeky, bilingual.
- Rate-limit nudges (e.g., one nudge per member per target per day) so it stays motivating, not spammy.
- Store nudges (id, group_id, from_user, to_user, created_at) so they can be displayed and rate-limited.

## 7. Weekly group recap

Auto-generated weekly summary that gives the group a moment to rally around.

- At the end of each week (Sunday), generate a recap per group showing: who hit their committed days, the group consistency % for the week, the most consistent member, the collective streak status, and total group check-ins for the week.
- Surface it as a card at the top of the group detail page and/or the feed when a new recap is available.
- Make it visually clean and screenshot-worthy (this is organic sharing fuel, the same role the milestone cards will play later). It can reuse the dark + volt brand styling.
- This is generated data, not a heavy job: compute it on demand from existing check-in data for the week range, cache the result. Explain the approach briefly before building.

## 8. Group chat

A simple real-time text chat inside each group detail page.

- A chat tab or section on the group detail page: members send text messages, see them in real time, basic and clean. No voice, no media beyond maybe a future image, no nesting.
- Reuse the same real-time pattern as the feed. RLS so only group members can read/write that group's chat.
- Keep it minimal. This is the group's talk space, not a feature-rich messenger.

## 9. Streak forgiveness (rest day / freeze)

Protect the loss-aversion engine from backfiring. Research is explicit: losing a long streak is discouraging and can drive churn, which is why Apple added streak pause and Duolingo built the Streak Freeze.

- Let a user mark a planned rest day, or grant a small number of "freezes" that prevent a single missed day from breaking the streak.
- Decide the cleaner model and explain the tradeoff before building: either (a) a weekly allowance of rest days that don't count as misses, or (b) a small bank of freezes the user spends. Keep it simple and clearly communicated so it never feels like cheating.
- The streak logic in lib/streaks.ts must account for rest days/freezes when computing whether a streak is alive. Update the unit tests accordingly.
- Reflect rest days distinctly in the heatmap (a different state from both checked-in and missed).

## Guardrails — still not in this batch

Do not build, even if tempted (these are later phases): real money payments or processing, the StepBet-style cash stakes engine (a simple honor-system social wager FIELD is fine to note as a Phase 3 hook but do not build payment rails), trainer dashboards and workout program boards, wearable/Apple Health integrations, milestone card image export (the weekly recap card is in-app only for now), and home-screen widgets. Leave clear `// PHASE 3` comments where hooks would go.

## Build order and acceptance

Build in numbered order. Acceptance for this batch:
- Tapping any member opens their profile with the three hero stats, corrected heatmap, and recent check-ins.
- The privacy toggle hides stats consistently while keeping checked-in-today status visible.
- The heatmap defaults to 3 months, toggles to 1 year, has a legend and tooltips, and is easy to read on a phone.
- The Groups list is a clean one-line-per-group directory; tapping opens a detail page with group-level stats and a per-member breakdown, both present.
- Reactions and comments work in real time on check-ins.
- An at-risk member can be nudged, rate-limited, bilingual.
- A weekly recap generates and displays per group.
- Group chat works in real time.
- Rest day / freeze correctly prevents a streak break and shows distinctly in the heatmap.
- Every new string is EN and ES. Every schema change went through a CLI migration. The dark + volt aesthetic is consistent throughout.

Built for Nico Zamora C.
