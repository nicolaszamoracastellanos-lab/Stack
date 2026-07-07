# STACK: Execute Redesign v3 (Autonomous Run)

Prompt for Claude Code. This file lives in the repo root alongside:

- `STACK_REDESIGN_MASTER_v3.md` (the design spec)
- `stack_v3_prototype.html` (the pixel target)

Read both fully before writing any code. The prototype is the source of truth for visuals; the v3 spec is the source of truth for scope, tokens, and rules. This file defines HOW you execute: loops, verification, and delivery.

---

## 0. Operating mode

- **Fully autonomous.** Do not stop to ask for approval on any design or implementation decision. Make the call, log it, keep moving. The founder reviews once, at the end, on a live preview URL.
- **Finish everything.** Every screen in the v3 spec, every system, every loop below. "Mostly done" is not done.
- **Deployment boundary:** push the feature branch so Vercel generates a preview deployment. Deliver that preview URL. Do NOT merge to main and do NOT touch the production deployment. Production merge happens only after the founder approves the preview. This is a hard line.

---

## 1. Execution order

1. Open `stack_v3_prototype.html` in a browser. Interact with all three tabs. Study it.
2. Baseline: screenshot every route at 390x844 to `/screenshots/before/`.
3. Foundation pass: font migration (Geist to Archivo per spec section 1), tokens, grain, card/button/pill recipes, motion primitives, press states (spec section 2).
4. Port the three prototyped screens: Landing, Home, Check-in celebration (spec section 3). Every rule there is binding, especially the Landing 3D wordmark rules: fixed resting pose, tilt only on touch, never auto-rotates, never a CSS filter on the preserve-3d element, period never wraps.
5. Extend the system to every remaining screen (spec section 4).
6. Run the loops in section 2 below as you go, then the final loop in section 3.
7. Deploy preview, write the report (section 5).

---

## 2. Revision loops (per screen)

For EVERY screen, run this loop. Do not move to the next screen until the current one passes or hits the iteration cap.

**Build → Verify → Critique → Revise. Max 3 iterations per screen.**

1. **Build** the screen per spec and prototype.
2. **Verify** with Playwright (install it if not present) at 390x844:
   - Screenshot to `/screenshots/after/{screen}-iter{n}.png`
   - Confirm zero console errors and zero hydration warnings
   - Confirm no horizontal scrollbar / no horizontal overflow at 375px and 390px
3. **Critique** against this checklist, honestly, in writing:
   - Side by side with `/screenshots/before/`, is the transformation instantly obvious? If a stranger could not tell which is the redesign, FAIL.
   - Does it match the prototype's type scale, depth, spacing, and motion? Deviations listed and justified, or FAIL.
   - Entrance stagger present? Press states on every tappable element? Numerals count up? FAIL any that are missing.
   - Volt discipline: one glowing focal element per screen. Red only for at-risk. FAIL otherwise.
   - EN and ES both render without overflow or truncation. FAIL otherwise.
4. **Revise** every FAIL and loop again.
5. If a screen still fails after 3 iterations, log exactly what remains and why in the final report, then continue. Do not silently ship a known FAIL as a pass.

---

## 3. Final integration loop (whole app, run twice)

After all screens pass their loops, run two full passes of the complete app in the Playwright browser at 390x844, executing these flows end to end like a real user:

- Sign up / log in (EN, then ES)
- Full check-in: Prove it steps 1 through 3, through the celebration screen
- Create a group, join a group by invite code
- Open every tab in the bottom nav; scroll every feed and list to the bottom
- Open profile, toggle the heatmap 3M/1Y, tap cells
- Trigger a reaction and a comment on a feed item

For each pass, fix everything found, then re-run. The second pass must complete with zero new findings. If it doesn't, fix and run a third. Do not deliver with known broken flows.

---

## 4. Mobile and scroll requirements (hard gates, test explicitly)

This app is used almost entirely on phones and gets wrapped in Capacitor. All of the following are pass/fail gates verified in the final loop:

**Scroll behavior ("scrolling down does nothing unexpected"):**
- `overscroll-behavior-y: none` on html/body (and `contain` on inner scroll containers): no pull-to-refresh, no rubber-band bounce exposing the page background, no scroll chaining from inner lists to the page.
- Scrolling must never trigger navigation, refresh, hidden animations, or layout shift. Scrolling a feed just scrolls the feed.
- The grain overlay and any ambient glows are fixed and do not shift, flicker, or repaint visibly during scroll.
- Sticky/fixed elements (bottom nav, sticky CTA) stay put with no jitter during fast scrolls.
- No horizontal scroll anywhere, any screen, at 375px, 390px, and 430px widths.

**iOS/mobile correctness:**
- Safe-area insets respected: bottom nav and sticky CTAs padded with `env(safe-area-inset-bottom)`; nothing hides behind the home indicator.
- Use `100dvh` (not `100vh`) for full-height layouts so the iOS Safari URL bar doesn't break them.
- `backdrop-filter` includes the `-webkit-` prefix; verify the bottom nav blur actually renders in WebKit.
- `-webkit-tap-highlight-color: transparent` app-wide; press feedback comes from the scale states, not gray flashes.
- All touch targets at least 44x44pt: verify the bottom nav items, chips, segmented controls, and feed action buttons specifically.
- Inputs are at least 16px font-size so iOS does not zoom on focus.
- Test at 390x844 and 430x932 viewports in Playwright with touch emulation enabled.

**Performance gates:**
- Lighthouse mobile: Performance 85+, Accessibility 95+. Run it, record the scores in the report.
- All animation on transform/opacity only. No layout thrash during the ring draw, count-ups, or entrance staggers.
- `prefers-reduced-motion` collapses all motion; verify by emulating it once in Playwright.

---

## 5. Delivery (what you hand back)

When everything above passes:

1. Push the feature branch. Confirm the Vercel preview deployment builds green.
2. Final gates: typecheck, lint, and production build all pass clean locally.
3. Write `REDESIGN_REPORT.md` in the repo root containing:
   - The preview URL, stated plainly at the top
   - Per screen: iterations used, final critique result, before/after screenshot paths
   - The two integration-loop passes: what each found, confirmation the final pass was clean
   - Mobile/scroll gate results, one line each, pass/fail
   - Lighthouse scores
   - Font migration summary and confirmation BRAND.md was updated, wordmark image assets untouched
   - Anything flagged for the native Capacitor track (routes, schema, endpoints)
   - Any screen that hit the 3-iteration cap without passing, with exactly what remains
   - Decisions you made autonomously that the founder should know about

The founder will open the preview URL on an iPhone, review, and either approve the merge to production or send revisions. Your job ends at the preview URL and the report.

---

## 6. Standing guardrails (unchanged, still binding)

- Feature branch only, incremental commits per screen or system.
- Zero functional regressions: every flow that worked before works after.
- No destructive Supabase migrations, no `.env` or secrets changes, no route/endpoint/schema renames without an explicit flag in the report.
- All user-facing copy bilingual EN/ES, natural Spanish, "stackear" as the verb, no em dashes anywhere.
- Red exclusively for at-risk streak alerts. Top-tier internal name never user-facing. Week is Monday to Sunday, user local timezone.
- No raw errors ever reach the UI.
