# STACK Redesign v3 — Delivery Report

## Preview URL

**https://stack-git-redesign-v3-nicolas-zamora-s-projects.vercel.app**

Branch `redesign-v3`, deployment `dpl_AVwd2FxCBQ3CHdLr7bCQzPxsbeoP`, state **READY** (built green).
Note: preview deployments on this account sit behind Vercel deployment protection — open the URL in a browser logged into your Vercel account (or via the [inspector](https://vercel.com/nicolas-zamora-s-projects/stack/AVwd2FxCBQ3CHdLr7bCQzPxsbeoP)). **Nothing was merged to main; production is untouched.**

Review account (already seeded with a group, check-ins, goal): `nicolaszamoracastellanos+v3tester@gmail.com` / `V3preview!2026`.

---

## What shipped

### Foundation (spec §1–2)
- **Geist retired for UI.** Archivo variable (wght 100–900, **wdth 62–125**) via `next/font/google` with the `wdth` axis loaded; verified `font-stretch` actually renders (measured 62/100/125% widths differ). Four roles as utilities: `.type-display`, `.type-numeral`, body, `.eyebrow` (micro-label at prototype values). BRAND.md records the migration; wordmark image assets untouched.
- Prototype tokens verbatim: card radius 22 / CTA 18 / input 14; card recipe (gradient + top hairline + 0 10px 30px); volt CTA (uppercase 800, 0 0 34px glow, active .97 + volt-dim); ghost recipe; tier pill (hairline + glowing dot); grain at 5% mounted once at shell; stagger 12px/380ms/70ms; press scale on every tappable.

### The three prototype screens (§3) — ported, not reinterpreted
- **Landing**: CSS-3D extruded `STACK.` (16 layers @2.2px, gray + dark-volt ramps from the prototype's `buildDepth`), fixed pose rotateX 16° / rotateY −14°, pointer-only tilt (lerp .09), eases back to pose, never flat, never auto-rotates; no filter/opacity/overflow on the preserve-3d element. Word-slam tagline (130ms stagger, volt second sentence + glow), one-time period pulse, prototype CTAs/footer.
- **Home**: ring 270px/16px stroke/r118, 850ms ease-out draw + count-up at 84px numeral, volt drop-shadow .75, radial ambience; streak card with 64px extruded volt numeral + DAY STREAK + tier pill; volt Check-in CTA; segmented control with sliding volt thumb (250ms spring curve); feed cards on the full recipe with inset 14px-radius photos; translucent blurred bottom nav, 62px raised volt camera (6px bg ring + 36px halo), volt active dot, 10px/700 uppercase labels.
- **Check-in celebration** *(new screen — posting used to jump straight home)*: STACKED. slam (spring), groups subtitle, card rise, **120px extruded streak that ticks +1 with a spring pop at 850ms**, 26-particle WAAPI volt burst (one shot), Share story card (volt) + Done (ghost). Spanish: **"STACKEADO."** — stackear vocabulary, flagged for your review.

### System extension (§4)
- **Groups**: monogram-color radial bleed on cards, active = volt hairline + soft glow, summit-stack empty state, display-weight names.
- **Prove it**: chips already carried depth + volt-hairline + pop; horizontal slide + progress bar kept; preselects intact (returning user = 3 taps + photo).
- **Profile**: stat tiles in the numeral role with count-up (current streak volt); heatmap centerpiece kept (5-step ramp, volt only at max, <600ms wave, 3M/1Y, tap tooltips).
- **Leaderboard**: oversized rank numerals (#1 at 32px), your row volt-hairlined.
- **Recap**: editorial card with the single volt headline stat in the numeral role.
- **Story cards**: Archivo everywhere; big numerals at 118% stretch + tabular, bold-template slam at 125%.
- **Sweep**: display-type titles on groups/checkin/activity/notifications/tiers/goal/install/pact/onboarding/penalty/create-group/error screens; auth shell; settings. Skeletons, press states, stagger all inherit the foundation.

## Screenshots
- Before: `screenshots/before/*.png` (every route @390×844, captured pre-change)
- After: `screenshots/after/*.png` (same routes EN + `-es` variants, final prod build)
- Per-screen iterations kept as `*-iterN.png` for landing/home.
The before/after difference is unmistakable on every primary screen.

## Verification

**Per-screen loops**: landing (2 iters), home (2 iters), celebration (1), all others passed on iter 1 after the foundation. No screen hit the 3-iteration cap.

**Integration loop (spec §3)** — full user flows in Playwright, iPhone-13 emulation:
- Pass 1 (dev): found and fixed **one real bug** — the celebration's particle overlay intercepted taps on Share/Done (missing `pointer-events-none`). Also fixed a harness selector.
- Pass 2 (dev): **37/37 checks, zero console errors, zero hydration warnings, zero new findings.**
- Pass 3 (production build): caught **inputs at 14px** (utility classes beat the 16px base rule → iOS zoom risk); fixed with an `!important` floor. Re-run: **37/37 clean.**
- Flows covered: login EN+ES, full check-in → celebration → home EN+ES, create group, join-by-code (member), every tab + scroll-to-bottom, heatmap 3M/1Y + cell tap, reaction toggle, comment post, signup → verify-email screen.

**Mobile/scroll gates (spec §4)** — all PASS:
| Gate | Result |
|---|---|
| `overscroll-behavior-y: none` html+body, `contain` on the scroller | pass |
| Scroll never navigates / no layout shift; bottom nav stable during fast scroll (y-delta < 1px) | pass |
| Grain fixed + pointer-events none | pass |
| No horizontal scroll @375 / 390 / 430, EN + ES | pass |
| Safe-area: nav pads `env(safe-area-inset-bottom)`; shell on `100dvh` | pass |
| `-webkit-backdrop-filter` on nav, blur renders | pass |
| Tap highlight transparent; press = scale states | pass |
| Touch targets ≥44pt (nav, segmented, chips, camera; reaction chips via hit-area expansion) | pass |
| Inputs ≥16px | pass (fixed in prod loop) |
| Reduced motion: mark static at base pose, entrances instant, no particles | pass |

**Lighthouse (mobile, production build)**: Landing **Performance 95 / Accessibility 100**; Login **88 / 100**. (Authenticated routes can't be measured headlessly without a session; gate applied to the public routes.) LCP 2.4s, TBT 0ms, CLS 0.

**Final gates**: `tsc --noEmit` clean · `next lint` clean · `next build` clean.

## Decisions made autonomously (review these)
1. **"STACKEADO."** as the ES celebration slam (spec asked for stackear vocabulary, you review final copy).
2. **User content is never uppercased** — spec §4 says "group names in display type," §1 bans caps on user content; §1 won. Names get 900 weight + ~110% width, sentence case.
3. **Feed photos stay 9:16** (inset, 14px radius) instead of the prototype's 180px placeholder tile — posted story cards are the content; cropping to 180px would destroy them.
4. **CTA glow ships only on large primary buttons** — small primaries (chat send, inline) stay quiet to keep one glow per screen.
5. **Splash now plays once per session** (sessionStorage) instead of on every full page load; PWA cold start still gets it.
6. **Waitlist link quieted** to dim text (was volt) — landing volt budget belongs to the CTA + tagline.
7. **Landing keeps the waitlist + language toggle** (not in the prototype, but removing them would be a functional regression).
8. **Bell is 44px** (prototype 38px) — the 44pt touch gate wins.
9. Fixed a **pre-existing** 14px horizontal overflow on all auth screens (oversized ambience blob).
10. Leaderboard "position changes animate" is N/A today — rank order only changes across server renders; noted for the native track rather than faking it.

## Flagged for the native (Capacitor) track
- No route/endpoint/schema renames. No Supabase migrations. `.env` untouched.
- New client screen state: check-in flow ends on celebration before `router.push("/home")` — deep-link/back-stack behavior worth testing in the shell.
- The 3D wordmark tilt uses pointer events — works with touch; verify on-device feel.
- `font-stretch` requires the wdth axis font file — the Capacitor build must keep loading Archivo with axes (bundled via next/font, so it ships in the build).

## Deliberately deferred
- Full **new-account signup via emailed confirmation link** in the automated loop (form → verify-email screen is covered; the seeded reviewer account exercises the authed app). Confirmation emails render fine (used one to provision the test account).
- Lighthouse on authenticated routes (no headless session support).
- Test artifacts in prod data: the `v3tester` account, its groups ("Ctoma", "Loop Crew"), a few check-ins and one comment. Say the word and I'll clean them up.

## Test infrastructure added (dev-only)
- `scripts/shoot.mjs` — route screenshot harness (EN/ES, any width, full check-in driver)
- `scripts/integration.mjs` — the §3 flows + §4 gates, 37 checks, exits non-zero on failure
- `playwright` as a devDependency
