# Stack — Onboarding & App Tour: Master Build Spec

> The first-run experience every new member sees: a welcome story (mission, vision, the why) followed by an interactive feature tour (the how). Save this file as `STACK_ONBOARDING.md` in the project root and point Claude Code at it.

---

## How to use this document

Save as `STACK_ONBOARDING.md` in your project root. Then in Claude Code:

> Read STACK_ONBOARDING.md in full and build the onboarding experience exactly as specified. Use the existing design tokens, the existing i18n system (every string EN and ES), and the Supabase CLI migration workflow for the schema change. Show me the welcome story screens and the tour first before wiring the trigger logic.

---

## The core idea: two moments, not one

There are two distinct first-run moments, and they must stay separate. Cramming them into one long slideshow is the classic mistake; people tap through and absorb nothing.

1. **The Welcome Story** (the WHY). Emotional, brand-forward, plays once right after signup, before profile setup. Mission and vision. Answers "what is this and why should I care."
2. **The Feature Tour** (the HOW). Practical, interactive, points at the real UI on the real home screen. Plays the first time the user reaches Home. Answers "how do I actually use this."

The story makes them care. The tour makes them capable. In that order.

---

## Part 1 — The Welcome Story

A short, full-screen, swipeable sequence shown once, immediately after signup and before the profile/onboarding fields. Dark background, volt accent, the Stack brand. Big type, minimal text per screen, one idea per screen. It should feel like a premium intro, not a tutorial. Bilingual EN/ES throughout.

Build it as a swipeable/paged sequence (horizontal swipe on mobile, also advanceable by a Continue button and tappable dots). A persistent "Skip" is available but the sequence is short enough that most won't need it. A progress indicator (dots) shows length.

### Screen 1 — The wordmark moment
- The Stack wordmark large, the volt square period, on near-black.
- One line below: "Show up. Every day." / "Preséntate. Todos los días."
- This is the brand breath before the message. A beat, then they swipe.

### Screen 2 — The mission
- Headline: "Getting in shape alone is hard. With your people, it sticks." / "Ponerte en forma solo es difícil. Con tu gente, se vuelve constante."
- Sub: one or two lines. The mission of Stack is to make showing up unavoidable by putting it in front of the people who matter to you. Not another solo tracker. A small circle that holds each other accountable.

### Screen 3 — The vision
- Headline: "We're building the place small crews get strong together." / "Estamos construyendo el lugar donde los grupos pequeños se ponen fuertes juntos."
- Sub: the vision. A private, no-excuses space for you and your friends, your brothers, your training partners, your coach and their clients. Real accountability, not a public highlight reel.

### Screen 4 — The promise / how it feels
- Headline: "Take the photo. Build the streak. Don't break the chain." / "Toma la foto. Construye la racha. No rompas la cadena."
- Sub: every workout is a check-in. Your group sees it. Your streak grows. Miss a day and everyone knows. That gentle pressure is the whole point.

### Screen 5 — The handoff into setup
- Headline: "Let's set you up." / "Vamos a configurarte."
- Sub: one line: it takes a minute, then you're in.
- A primary "Let's go" / "Vamos" button that routes into the existing profile onboarding (username, photo, sport, etc.).

Keep entrances clean: each screen's headline fades and rises a few pixels, the sub follows ~150ms later. Fast, disciplined, never bouncy. Match the splash-screen motion language.

---

## Part 2 — The Feature Tour

An interactive, guided walkthrough that plays the first time the user lands on Home (after profile setup). Unlike the story, this points at the actual interface. Use a coach-mark / spotlight pattern: dim the screen, highlight one real UI element at a time with a short tooltip and a Next button, walking through the app in a logical order.

Build it as a reusable tour system (a lightweight library like react-joyride or a custom spotlight overlay, whichever fits the Next.js setup cleanly, recommend and explain the choice). Each step: a highlighted target element, a short title, one or two lines of copy, a Next button, a step counter (e.g., 3 / 8), and a Skip tour option always available. Bilingual.

The tour, in this order. Each step explains both WHAT it is and WHAT TO DO:

1. **Welcome to Home** — orient them. "This is your home. Your group, your streak, your feed, all in one place." Point at the overall screen or the group switcher.
2. **The check-in button** (the volt camera). "This is how you check in. Tap it after any workout, take a photo, and it posts to your group. This is the one thing you do every day." Highlight the camera.
3. **The consistency ring** — "This shows how many of your committed days you've hit this week. Fill it up." Highlight the ring.
4. **Your streak + the group streak** — "Your day streak is consecutive days you showed up. The group streak only survives if everyone shows up. One person misses, it breaks for all of you." Highlight the two streak stats.
5. **The feed** — "When anyone in your group checks in, it shows up here. React, comment, cheer them on." Highlight the feed / a feed item.
6. **The at-risk dot + nudge** — "A red dot means someone hasn't checked in today. Tap nudge to give them a friendly push." Point at the leaderboard / member area (or explain it will appear there).
7. **Groups** — "Create or join groups from here. Tap any group to see its stats, members, chat, and weekly recap." Highlight the Groups nav.
8. **Profile & The Stack** — "Your profile shows your streaks, your totals, and The Stack, your full check-in history. Tap anyone's name to see theirs." Highlight the Profile nav.
9. **Final step** — "That's it. Take your first photo and start your streak today." A primary button that either closes the tour or opens the check-in flow directly. End on the core action.

If a highlighted element isn't on the current screen (e.g., the at-risk dot when no one is at risk), either navigate the tour to where it lives or show the explanation without the spotlight rather than breaking. Handle gracefully.

---

## Triggering logic (important)

- Add a boolean (or two booleans) to the profiles table via CLI migration: `has_seen_welcome` and `has_completed_tour`, default false.
- **All existing accounts must go through this**, since they are effectively new. Default both flags to false for everyone, including current users. So the next time any existing user logs in, they get the welcome story and the tour.
- Flow on login / app open:
  - If `has_seen_welcome` is false and the profile is brand new -> show the Welcome Story, then profile setup. (For existing users who already have a profile, show the Welcome Story once on next login, then drop them at Home for the tour, skipping the profile fields they already filled.)
  - When the user reaches Home and `has_completed_tour` is false -> start the Feature Tour.
  - Set each flag true when its experience is completed or skipped, so neither replays.
- Add a way to **replay the tour** from profile settings ("Take the tour again" / "Ver el tour de nuevo"), because people forget and because it's useful for showing the app to others.

---

## Design and copy principles

- One idea per screen/step. Short copy. Big type. The dark + volt aesthetic.
- Every string EN and ES via the existing i18n system. Write natural Spanish, not machine-translated.
- Always allow Skip, but make the experience short enough that skipping isn't tempting.
- The story is emotional and brand-led; the tour is practical and points at real buttons. Keep those voices distinct.
- Motion matches the splash: fade-and-rise, fast, disciplined, never bouncy.
- Never trap the user. Skip and Next always work. The tour never blocks them from using the app if they dismiss it.

## Acceptance

- A brand-new signup sees: Welcome Story -> profile setup -> Home -> Feature Tour -> first check-in prompt.
- An existing account, on next login, sees the Welcome Story once, then the Feature Tour on Home, without being asked to redo profile fields they already completed.
- Neither experience replays once completed or skipped (flags persist in the database).
- The tour highlights the real UI elements correctly and handles missing elements gracefully.
- The tour can be replayed from settings.
- Everything is bilingual and matches the brand.
- The schema change went through a CLI migration.

Built for Nico Zamora C.
