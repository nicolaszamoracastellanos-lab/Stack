# Stack: Complete Platform Brief for the Marketing Team
**Version 1.0 · August 2026 · Owner: Nico Zamora C.**
Product: Stack · stack-app.online · Private small-group fitness accountability

> **Status: the web platform is live. The mobile app is coming soon.**
> Stack works today as an installable web app (PWA) on any phone. A native mobile app is in the pipeline and access is very close. Until Apple enrollment is confirmed, never promise an App Store date, TestFlight access, or health-verified check-ins in public content. "App coming soon" with no date is the approved public framing.

This document is the single onboarding read for anyone marketing Stack. It covers what the product is, why it exists, everything it can do, how it looks, how people share from it, what is coming next, and where the execution playbooks live.

Companion documents (same folder):
- `STACK_SOCIAL_MARKETING_PLAN_v1.md`: the full campaign plan (Founding Crews), channels, calendar, metrics
- `STACK_CONTENT_GENERATION_GUIDE_v1.md`: the execution manual, brand tokens, asset templates, tools, sanitize checklist

---

## 1. What Stack is

Stack is a private accountability app for small crews of 2 to 8 people who struggle to show up for the gym alone. Every day you work out, you check in with a photo taken inside the app. Your crew sees it instantly. Your streak grows. Miss a day and everyone knows.

**Tagline (locked):** Show up. Every day. / ES: Preséntate. Todos los días.
**Verb (locked):** stackear. "Stackea con tu crew." Never translate it back to a generic verb.
**Core message:** Consistency is a group project. / ES: La constancia es cosa de equipo.

## 2. Mission, vision, and point of view

**Mission:** get people to show up consistently by putting their workouts in front of a small group of people who will notice the moment they stop.

**Vision:** consistency is not a personal-discipline problem, it is a group project. Nobody stays consistent alone. Stack replaces the dead group chat ("gym at 6?" left on read) with a private feed that actually creates social weight.

**The thesis, in the product's own words:**
- Your group chat is not accountability. A feed your crew checks is.
- Discipline is not the problem. Being unwatched is.
- Proof, not promises. Every check-in is a photo.
- The streak belongs to the week, not the day. One missed Tuesday does not nuke you.
- Private by design. No public feed, no public profiles, no followers, no discovery surface. This is deliberate and it is Stack's sharpest differentiator against Strava-style public fitness.

**Origin story (usable in content, consent rules apply):** built by one person, in public, for his own real crews, with a personal anchor date of November 27, 2026. The first users were the founder's brothers and friends.

**Emotional register:** dark, intense, disciplined, a little serious, gym at 6am. Not wellness, not pastel, not cheerful, not corporate.

## 3. Who it is for

Full profiles are in the marketing plan. The short version:

1. **The Crew Captain (primary).** 24 to 35, organizes the group chat, trains or wants to train 3 to 5 times a week, already has the exact WhatsApp/iMessage group Stack needs. Bilingual EN/ES skews high. They are on TikTok, not LinkedIn.
2. **The Crew Member (secondary).** Joins because the captain asked. Will not download an app on their own. Reached secondhand, which is why we recruit crews, not individuals.
3. **The Build-in-Public Audience (tertiary).** Indie hackers and founders on Threads/X. They amplify and critique; they are not a user-acquisition channel.

**The strategic constraint:** an individual who joins alone gets a dead product. Everything Stack does in marketing captures crews (a captain plus 3 to 7 named people), never bare emails.

## 4. Complete capability catalog (live today)

Everything below is built, live, and real. Every claim here can be shown on camera with a real screen recording.

### Accounts and onboarding
- Email sign-up and login with immediate session, guided onboarding flow, and an animated welcome story that teaches the product's mechanics.
- Goal setup: each user declares their weekly training target (1 to 7 days per week). This target drives the whole consistency system.
- Profile with display name, bio, avatar (with built-in image cropper), and automatic timezone sync so weeks and streaks are always computed in the user's local time.

### Crews (private groups)
- Create a crew, name it, describe it, set its vibe. 2 to 8 people.
- Join by invite code or shareable invite link (deep link straight into the join flow). There is no way to find a group you were not invited to. Zero discovery surface.
- Multiple crews per person, a combined home that merges them, pinned crews, and a solo mode that works before your crew arrives.
- Crew admin tools: remove members, edit group settings.

### The photo check-in ("Prove it" flow)
- Two taps to check in. Three quick steps: pick the sport, pick the crew(s), take the photo.
- Sport picker (gym, run, cycling, swim, sports and more), environment, training focus, and optional notes.
- The photo is taken inside the app, and the Stack wordmark watermark is burned into every posted photo. Whatever leaves the app carries the brand.
- A full-screen celebration moment after posting (confetti particles, streak count-up). This is the dopamine hit and it films beautifully.
- Rest day prompt: the app tells you when it is fine to rest, and the streak survives. Friction goes on quitting, not on checking in.

### The live crew feed
- Real-time: when someone checks in, the crew sees it instantly, no refresh.
- Reactions on check-ins, landing live.
- Crew chat with @mentions.
- Nudge button: poke a crewmate who has gone quiet. The nudge lands as a notification and a banner.

### Streaks and consistency (the core mechanic)
- **Weekly quota streaks.** The streak is measured against your declared weekly target, not a daily chain. Life-proof by design: one missed day does not break you as long as the week's quota is still reachable.
- Streak states: alive, at risk, broken.
- **The at-risk alert.** Fires before you break, not after, the moment your slack for the week hits zero. This is the one and only place red appears in the entire product. (Marketing rule: never use red anywhere else, ever.)
- Consistency ring on Home showing the week filling up (for example 3 of 6, 50%).
- Streak milestones at 7, 14, 30, 60, 100, and 365 days, each unlocking a special shareable card.
- Personal records and a GitHub-style activity heatmap on every profile.
- Broken pacts and streaks are handled with playful, never-shaming copy, written natively in both languages.

### Tiers (the game layer)
- A color-coded tier badge earned by weekly training frequency, from Slate (1x/week) up through Amber, Purple, Bronze, Volt, Silver, and Gold (7x/week).
- Week one grants an instant provisional tier; a tier is confirmed after four full weeks, and the confirmed badge only moves monthly, so one bad week never drops it.
- An in-app tier guide explains the ladder.
- Two people can hold the same streak; the tier color shows how hard each is going.

### Pacts and stakes (put something on the line)
- Any crew can become a pact by setting a weekly workout target for the group.
- Honor-system stakes: money, a favor, or a custom stake. Configurable rules for who pays (the breaker, anyone who misses, or last place) and duration presets of 4, 8, or 12 weeks.
- Optional discipline restrictions (only these sports count toward the pact).
- Automatic detection of broken pacts, per-member timezone-correct weeks, a stakes ledger, broken-pact cards with rotating bilingual roast lines (playful, never shaming), and pact alerts to the whole crew.
- Pact proposals and editing flow inside the crew.

### Leaderboard and social proof inside the crew
- Weekly leaderboard per crew.
- Member profiles visible to crewmates: streak, tier, records, heatmap, recent activity.
- Weekly recap cards summarizing how the crew did.

### Notifications
- In-app notification center with a bell and unread state.
- Web push notifications (check-ins, nudges, at-risk warnings, pact events), with per-category notification settings.
- iPhone push requires the app to be installed to the home screen; the in-app install guide walks users through it.

### Bilingual, for real
- Every screen, email, and string exists in English and Spanish. The toggle is in the header on every screen and flips the whole interface live.
- Spanish is written natively, never machine-translated. This includes the humor (roast lines, celebration copy).
- Great on camera: the EN/ES toggle demo consistently performs with a bilingual audience.

### Installable app experience (PWA)
- Stack installs to the phone home screen today, full-screen, with its own icon and splash screen. This is why "the app is coming soon" coexists honestly with "you can use Stack on your phone right now."
- Guided install instructions with illustrations, per platform.

### Email
- Transactional email over Resend on the verified domain: waitlist confirmations and onboarding welcome emails, bilingual.

### Waitlist and crew capture
- The landing page captures waitlist signups today, wired to Supabase with a Resend confirmation. (The crew-unit capture form described in the marketing plan is the highest-priority landing upgrade; check the plan's open questions before promising it in content.)

### Internal tooling (never shown publicly)
- A founder-only ops panel (demo data, simulators, notification testing) exists for producing clean demo content. Ask Nico for a sanitized demo account instead of recording real crews.

## 5. The user interface (what you can show on camera)

Stack shipped a full v3 visual system in July 2026. It is a designed product, not a prototype, and the UI itself is a marketing asset.

- **Landing:** a 3D extruded "STACK." wordmark with touch parallax, word-by-word tagline slam animation, volt accent glow. Films great in hand.
- **Home:** consistency ring, streak, this week's progress, the crew feed.
- **Check-in:** the three-step Prove it flow ending in the celebration screen.
- **Crews:** the groups dashboard (named crews, zero discovery, zero follower counts anywhere).
- **Profile:** heatmap, records, streak and tier surfaces.
- **Design system:** near-black `#0A0A0B` everywhere, one volt green `#C6F806` accent used scarcely, Archivo Expanded Black 900 display type, 44pt tap targets, dark only. There is no light mode and that is a brand decision.
- Screens worth recording are listed in the Content Generation Guide ("What gets recorded"), with the recording standard and the mandatory sanitize checklist. **Never post a frame with real member names, faces, group names, or group descriptions without explicit consent. Use the demo account.**
- **Never generate fake Stack UI with AI tools. Real screen recordings only.** One AI-rendered screen destroys the build-in-public credibility permanently.

## 6. Ways to share Stack publicly

Surfaces built into the product (organic loops):
1. **Watermarked check-in photos.** Every posted photo carries the Stack wordmark. One tap opens the native share sheet (Instagram, Messages, WhatsApp, save to camera roll). Users spreading their own proof is the primary organic loop.
2. **Story cards.** Designed shareable cards generated from a check-in (see section 7), built for Instagram Stories and group chats.
3. **Invite links and codes.** Every crew has a shareable link that deep-links into joining that specific crew. This is how crews actually assemble.
4. **The waitlist link.** stack-app.online, captures signups today.

Channels we post on (full strategy in the marketing plan):
- **TikTok (primary).** 4 to 5 per week, partner-produced. Blunt, funny, gym-culture native, bilingual.
- **Threads (secondary).** Build-in-public founder voice, 5 to 7 short posts a week.
- **Instagram Reels (third).** Repurposed TikTok cuts plus the belief carousel. Reformat only, never originate here.
- **LinkedIn (optional).** One restrained milestone post a month at most.
- **Email (Resend).** Captain-focused drip, short and direct.
- Every post ends with the same line: "Link in bio if you want your crew in the first group."

Content pillars (percent of output): Proof of Build 30, The Belief 25, Crew Stories 20 (consent-gated), Product Glimpse 15, Bilingual and Culture 10.

## 7. The sharing system (how a picture leaves the app)

1. User checks in with a photo. The Stack wordmark watermark is burned into the image at capture time, not overlaid after.
2. From the feed or the celebration screen, tapping share opens the phone's native share sheet with the watermarked file. On desktop it downloads.
3. Alternatively the user generates a **story card** from the check-in: a designed, branded frame around their moment, picked from the template set below, then shared the same way.
4. Result: every image circulating in group chats and stories is on-brand with zero effort from the user.

## 8. The picture-sharing templates

In-app story card templates (user-facing, live today):
| Template | What it is |
|---|---|
| **Minimal** | Clean dark card, the essentials only |
| **Bold** | Big display type, statement energy |
| **Stat** | The numbers up front: streak, week progress |
| **Photo** | The check-in photo as the hero, branded frame |
| **Milestone** | Unlocked only when a streak milestone is hit (7, 14, 30, 60, 100, 365 days) |

Users toggle what appears on the card: sport and environment, training focus, notes, streak, date (sport, focus, streak, and date are on by default; notes off).

For marketing-made assets (carousels, title cards, B-roll, hero stills), use the ready copy-paste templates in the Content Generation Guide: the brand block, the belief carousel prompt, the TikTok title card prompt, and the Higgsfield B-roll and hero-still prompts, plus the tool-to-asset map (Canva for layout, Higgsfield for cinematic, never any tool for UI).

## 9. Coming soon (what we will have as the app lands)

**The headline: the mobile app is coming soon, and we are very close.** Public copy may say "App coming soon." Public copy may NOT name a date, an App Store link, or TestFlight until Apple enrollment is confirmed done.

In the pipeline, roughly in order:
1. **Native mobile app** (iOS first). Unlocks the App Store presence and removes the install-guide friction.
2. **First-class push notifications on iPhone** without the add-to-home-screen step.
3. **Health-verified check-ins** (Apple Health / HealthKit): automatic workout detection backing the photo proof. Do not market this at all until the privacy copy (EN and ES) and Apple review are cleared. Publicly this feature does not exist yet.
4. **Crew capture on the landing page** (captain plus named crew members, not bare emails) feeding the captain email sequence, per the marketing plan.
5. **App Store screenshot set** produced from the sanitized demo account once enrollment resolves (sizes already specced in the Content Generation Guide).
6. Longer-term concepts held in the data model: trainer/coach dashboard. Do not market these.

There is no paid tier and nothing to buy. Pre-launch success is measured in committed crews (target: 25 founding crews), then Week-4 group retention after launch. Never report raw email counts as success.

## 10. Brand rules, the ten-second version

Full tokens and the copy-paste brand block are in the Content Generation Guide. The absolute rules:

1. Near-black `#0A0A0B` background always. No light backgrounds, ever.
2. Volt `#C6F806` is the only accent, one element per frame, never recolored.
3. **Red is forbidden** everywhere except the in-app at-risk alert shown in a real screen recording.
4. **No em dashes in any copy.** Periods, commas, colons, parentheses.
5. Wordmark is "Stack." with the volt square period always attached.
6. Display type is Archivo Expanded Black 900, sentence case, tight tracking.
7. Spanish is written natively, never machine-translated.
8. Never show or imply public feeds, follower counts, or public profiles. Stack has none.
9. Never generate fake Stack UI. Real screen recordings only, from the sanitized demo account.
10. Never post real user names, faces, group names, or group descriptions without explicit consent.

## 11. The plan, in one paragraph

The pre-launch campaign is **Founding Crews (Crews Fundadoras)**: recruit whole friend groups, not individual signups, so Stack launches into crews that already exist. TikTok is the engine, Threads is the build-in-public channel, Instagram repurposes, email keeps captains warm, and Nico closes crews in DMs. Marketing gets a hard cap of 2 hours a week (75-minute Sunday batch plus distributed slots) so it never eats build time. Targets: 40 captains in 30 days, 25 launch-ready crews in 60 days, and at least 40 percent of activated crews still showing group activity in Week 4 after launch. The full calendar, metrics, and risk table are in `STACK_SOCIAL_MARKETING_PLAN_v1.md`. Read it next, then the Content Generation Guide before producing a single asset.

---

*Questions, demo account access, consent status, or anything ambiguous: ask Nico before posting. When in doubt about a frame, cut the frame.*
