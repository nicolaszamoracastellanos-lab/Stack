# STACK: Web App Elevation Pass (v1)

Master prompt for Claude Code. Read this entire document before writing or changing any code.

---

## 0. Role and mission

You are doing a full top-to-bottom quality pass on Stack, a live production web app at stack-app.online (Next.js 14, App Router, Supabase, Tailwind, TypeScript, Vercel). This is not a rewrite. It is an elevation pass: audit everything, fix everything broken, and raise the visual and interaction quality of every screen to the level of the best consumer apps in this category. Think the craft level of Whoop, Strava, or Linear, not their specific visual style.

You have full autonomy for this pass. Work end to end and produce a single final report when done. Do not stop mid-pass to ask for approval on individual changes. Do stop and flag clearly in your final report anything genuinely ambiguous, anything that would touch user data destructively, or anything that conflicts with a rule in this document.

---

## 1. Non-negotiable context

Read this section fully before touching code. These are constraints, not suggestions.

### 1.1 Stack (the technical kind)

- Next.js 14, App Router
- Supabase: auth, database, storage, realtime
- Tailwind CSS with custom design tokens
- TypeScript
- Vercel hosting
- PWA manifest already in place

### 1.2 This codebase will be wrapped in Capacitor for native iOS/Android

A native mobile build is in progress on a separate track. It wraps this exact web codebase in Capacitor. That means:

- Build mobile-first and touch-first. Every interactive element needs a non-hover affordance.
- Minimum touch target: 44x44pt.
- Do not rely on browser-only APIs that will not exist inside a Capacitor WebView without a plugin.
- Do not rename or remove existing routes, API endpoints, or Supabase table/column names the native build may depend on without calling it out explicitly in your final report.
- Scope of this pass is the web experience only. Do not set up Capacitor, HealthKit, or Health Connect. Do not touch anything native-specific.

### 1.3 Brand system (do not deviate)

Colors:
- Volt (accent, the soul of the brand): `#C6F806`. Used sparingly. Never as a fill for large areas. Never recolored.
- Volt dim (pressed/hover state): `#9BC400`
- Background (near-black): `#0A0A0B`
- Surface: `#141416`
- Surface 2 (raised cards): `#1C1C1F`
- Border: `#26262A`
- Border strong: `#3A3A40`
- Text: `#FAFAFA`
- Text muted: `#A1A1AA`
- Text dim: `#5C5C66`
- Red (danger): reserved exclusively for at-risk streak alerts. No other use, anywhere, ever.

Typography: Geist, weight 800 for the wordmark and primary headings.

Theme: dark, intense, high-contrast. This is not a light-mode app.

Wordmark: "Stack" followed by a small volt rounded-square period. Never alter this lockup.

Icon: the "summit stack," three rounded bars climbing to a volt peak on a near-black rounded square.

### 1.4 Copy rules (apply everywhere, including any new copy you write)

- Every user-facing string ships in English and Spanish. Spanish must be natural and idiomatic, not machine-translated. Native speaker quality.
- "Stack" is kept as a loanword verb in Spanish: stackear.
- No em dashes anywhere, in any language, in any copy.
- Never show a raw error to a user. Every error state gets a branded, friendly, on-brand message with a clear next action. If you find a raw error, stack trace, or unhandled exception surfacing in the UI anywhere, treat that as a P0 fix.
- Tagline: "Show up. Every day." If a natural Spanish equivalent does not already exist in the codebase, write one that carries the same weight. Do not translate it literally, word for word.
- "Prove it" is the name of the check-in/verification flow. Keep this name.
- The tier system has an internal name for the top tier (5x/week) with internal rationale. That internal name and rationale must never appear in user-facing copy, anywhere. It is fine in code comments, internal docs, or your final report.
- Week runs Monday through Sunday, in the user's local timezone. Verify this is implemented correctly everywhere a week boundary matters: streak resets, weekly recap, consistency ring, leaderboard.

---

## 2. Current state (what you are starting from)

Known screens today include:

- **Landing/auth**: wordmark, EN/ES toggle, tagline, supporting line, "Start stacking" and "Log in" CTAs.
- **Home**: circular consistency ring (percent this week, fraction like 3/6), day streak counter with a tier badge (e.g. "Purple, Provisional"), a primary "Check in" CTA, an All Activity / Groups toggle, and a chronological activity feed of group members' check-ins.
- **Groups**: "Your groups" list as cards with colored monogram avatars, status labels, group taglines, streak flame counts, a "Create a group" CTA, and a join-by-invite-code field.
- **Prove it (check-in flow)**: a 3-step flow with a progress bar. Step 2 covers which group(s) the check-in goes to (multi-select, plus a private "Just me" option), sport search with a tag grid, an indoor/outdoor toggle, a focus tag grid, and a free-text notes field.
- **Profile**: avatar, display name, handle, bio, tier badge, three stat tiles (current streak, longest streak, total check-ins), an About section (favorite sport, usual training frequency, focus this month), and "The Stack," a check-in history heatmap with a 3M/1Y range toggle.

Treat this as a starting map, not a ceiling. Explore the actual codebase for the full route and component list before you begin.

---

## 3. Phase 1: Full audit (do this before changing anything)

Go through the entire application, route by route, component by component. For each screen and flow, log the following.

**Visual and UX issues**
- Inconsistent spacing (should conform to a single spacing scale, not ad hoc values)
- Inconsistent border radius, or inconsistent card/badge/pill treatments across screens
- Typography inconsistencies (weight, size, line height not matching a defined scale)
- Contrast issues (any text below WCAG AA against its background)
- Missing or inconsistent hover, press, and focus states
- Missing loading states (bare spinners where skeleton loaders should be, or nothing at all)
- Missing empty states (a new group with no check-ins, a new user with no history)
- Any raw error, console error, or unhandled promise rejection reaching the UI
- Broken or inconsistent responsive behavior at common breakpoints (375px, 390px, 414px, 768px, 1024px+)
- Any place a component visually diverges from how the same type of component looks elsewhere

**Functional issues**
- Broken flows, dead ends, buttons that do nothing, links that 404
- Auth edge cases (expired session, invalid invite code, duplicate email)
- Streak and consistency-ring calculation edge cases (timezone boundaries, rest day/forgiveness logic, week rollover)
- Realtime subscriptions that do not clean up on unmount, or do not update the UI live when they should
- Form validation gaps, client-side and server-side
- Image upload and watermarking issues in the check-in photo flow
- Notification/nudge delivery issues
- Anything in onboarding that could strand a new user

**Technical debt**
- Dead code, unused components, unused imports
- Duplicated components that should be consolidated into one
- Hardcoded copy that should be in the bilingual string system
- Any place internal-only naming (like the top-tier internal name) leaks toward a user-facing surface

Document all of this. It becomes the "Issues found" section of your final report.

---

## 4. Phase 2: Design system elevation

Within the existing brand constants above (do not change the palette, wordmark, or icon), raise the execution quality:

- Define and apply one consistent spacing scale (4px or 8px base, your call, but pick one and apply it everywhere).
- Define and apply one consistent border-radius scale across cards, buttons, inputs, and badges.
- Define a clear typographic scale: a small number of distinct sizes/weights, each with a defined purpose (page title, section header, card title, body, caption, label).
- Build or consolidate a real component library: one Button (with its variant states), one Card, one Badge/Pill, one Modal/Sheet, one Toast, one Input, one Avatar. Every screen should compose from these, not redefine them ad hoc.
- Motion: purposeful, fast, on-brand transitions (150 to 300ms, eased). Press states should feel tactile (subtle scale or opacity shift on tap). No gratuitous animation. Skeleton loaders instead of bare spinners wherever content loads.
- Volt discipline: audit every current use of the volt accent. It should read as a highlight, CTA, or success color, never a large background fill, never the dominant color on more than one element per screen.
- Red discipline: audit every current use of red. If it is used for anything other than at-risk streak alerts, fix it.

---

## 5. Phase 3: Feature-by-feature elevation

Bring each of these to a top-tier bar. This list is a checklist, not a ceiling: apply the same bar to anything not listed here.

- **Onboarding**: reduce friction, make progress visible, make each step feel like it is building toward a commitment, not filling out a form.
- **Auth/landing**: first impression. Should feel premium and confident, not like a generic SaaS login screen.
- **Home**: the ring and streak are the emotional core of the app. The ring should animate on load and on update. The streak flame should have presence.
- **Groups**: cards should feel personal and distinct (lean further into the colored monograms). Joining via invite code should feel instant and rewarding.
- **Prove it (check-in flow)**: the most-used flow in the app. Make it fast. Look hard at whether all three steps and every field are truly necessary, or whether smart defaults (last used sport, last used group selection) can cut steps without losing data you actually need.
- **Streaks and rest-day forgiveness**: logic must be bulletproof. UI must clearly communicate current streak, at-risk state (red, and only red), and how forgiveness works.
- **Consistency ring and leaderboard**: make comparison across group members feel motivating, not anxiety-inducing.
- **Member profiles**: stat tiles, About section, and "The Stack" heatmap should feel cohesive. The heatmap is the one truly unique data visualization in the app and deserves the most polish.
- **Reactions/comments**: instant (optimistic UI), lightweight, low-friction.
- **Nudges**: should feel like a nudge from a friend, not a push notification from an app.
- **Weekly recap**: a retention moment. Make it feel earned and worth opening.
- **Group chat**: simple and fast. A utility feature, not the core loop, do not over-invest here.
- **Shareable story cards**: a growth lever, since people share these outside the app. They need to look genuinely great out of context, on light or dark backgrounds, with the wordmark watermark correctly applied.
- **Group pacts (stakes/rules)**: the stakes framing should feel serious without feeling punitive.

---

## 6. Phase 4: Technical hardening

- Replace every raw or unhandled error surface with a branded error state (bilingual, on-brand copy, a clear next action).
- Add skeleton loading states everywhere data is fetched.
- Add optimistic UI updates for check-ins, reactions, and nudges.
- Audit and fix Supabase queries for efficiency: no waterfalled requests where a single query with proper joins would do. Confirm indexes exist on frequently filtered or sorted columns.
- Audit all realtime subscriptions: confirm they unsubscribe on unmount and update the UI correctly when they fire.
- Full form validation pass, client and server side, with bilingual inline error messaging.
- Full accessibility pass: aria labels, keyboard navigation, focus management in modals/sheets, WCAG AA contrast everywhere, not just on primary text.
- Confirm Next/Image is used correctly, images are properly sized and compressed, and the check-in watermark is applied consistently.
- Performance pass: target Lighthouse Performance 90+ and Accessibility 95+ on mobile. Audit bundle size, code-split where it helps, lazy-load anything below the fold that can be.
- Confirm the PWA manifest and full icon set are correctly wired up.

---

## 7. Guardrails for this pass

- Work on a feature branch. Never commit directly to main or push to production.
- Commit incrementally, grouped by logical unit (for example, one commit for the design token and component library work, one per feature area), with clear messages.
- Run typecheck, lint, and build before considering this done. All three must pass clean.
- Do not run destructive Supabase migrations. Additive changes only. If a schema change is genuinely needed, write it as a reversible migration and flag it clearly in your final report rather than running it against production data unannounced.
- Do not touch `.env` files or any secrets.
- Do not remove or rename existing routes, API endpoints, or database columns the native Capacitor build may depend on without flagging it explicitly in your final report, with your reasoning and suggested alternative.
- Everything must remain mobile-first and touch-first. This codebase becomes the native app.

---

## 8. Final report (what "done" looks like)

When you finish, produce a written summary covering:

- Every issue found in the Phase 1 audit, and its resolution (fixed, or explicitly deferred with reasoning)
- A before/after description of each major screen you touched
- Every place you touched the design system (spacing, radius, typography, component consolidation)
- Confirmation that typecheck, lint, and build all pass
- Any route, schema, or API change flagged for the native Capacitor track
- Anything deliberately left out of scope, and why
