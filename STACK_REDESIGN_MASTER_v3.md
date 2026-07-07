# STACK: Redesign v3 (Prototype Port)

Prompt for Claude Code. Read fully before writing code.

---

## 0. What changed and why v3 is different

Two prior passes (v1, v2) described the desired design in prose. Both produced timid, near-invisible results. v3 removes interpretation from the job entirely.

**A working HTML prototype is included in this repo (or provided alongside this prompt): `stack_v3_prototype.html`. It shows the redesigned Landing, Home, and Check-in Celebration screens, fully styled and animated. That file is the source of truth. Your job is to port it into the Next.js codebase pixel for pixel, then extend its exact system to every remaining screen.**

Rules of engagement:

1. Open the prototype in a browser first. Interact with all three tabs. Study the motion, the type, the depth, the glow.
2. Port, do not reinterpret. If the prototype's streak numeral is 64px volt with a layered extrusion shadow, the app's streak numeral is 64px volt with a layered extrusion shadow. Copy the CSS values directly.
3. Where a screen is NOT in the prototype (Groups, Prove it, Profile, etc.), extend the prototype's system to it using the rules in section 4. Same tokens, same components, same motion vocabulary.
4. Screenshot gate still applies: before/after captures of every route at 390px. Any screen whose after looks like its before gets redone.

---

## 1. Font migration (breaking change, approved by the founder)

Geist is retired for UI. The new type system is **Archivo** (Google Fonts variable: weight 100 to 900, width 62 to 125).

- Display role: Archivo, `font-stretch: 125%` (Expanded), weight 900, UPPERCASE, letter-spacing -0.02em to -0.04em. Used for: taglines, screen titles, section slams, the wordmark text where rendered as live text.
- Numeral role: Archivo, `font-stretch: 115% to 120%`, weight 900, `font-variant-numeric: tabular-nums`, tight tracking. Used for: streaks, percentages, counts, all stats.
- Body role: Archivo, normal width, weight 500 to 600.
- Micro-label role: Archivo, weight 700, 10 to 11px, UPPERCASE, letter-spacing 0.2em+, color text-dim.

Implementation notes:
- Load via `next/font/google` with the variable axes, or the CSS2 URL from the prototype's `<head>` if axes require it. Subset to latin. Confirm `font-stretch` renders (it requires the wdth axis to be loaded).
- The wordmark PNG/SVG assets (Geist-based) stay as-is wherever they are used as images. Only live-text usage migrates.
- Update BRAND.md to record the change: display face is now Archivo Expanded Black, Geist retired for UI.
- All caps display text must never apply to user-generated content (names, group names, notes). Chrome is loud; user content stays sentence case.

---

## 2. Tokens and primitives (copy from the prototype verbatim)

Everything below already exists as working CSS in `stack_v3_prototype.html`. Lift it into the Tailwind config / global CSS, then delete any older conflicting styles.

- Color tokens: unchanged from brand (volt `#C6F806`, volt dim `#9BC400`, bg `#0A0A0B`, surface `#141416`, surface2 `#1C1C1F`, borders `#26262A` / `#3A3A40`, text `#FAFAFA` / `#A1A1AA` / `#5C5C66`). Red remains at-risk-only.
- Grain overlay: the exact SVG feTurbulence data-URI from the prototype, fixed full-viewport, ~5% opacity, pointer-events none. Mount once at the app shell level.
- Card recipe: `linear-gradient(180deg, surface2, surface)`, 1px border, 22px radius, `inset 0 1px 0 rgba(255,255,255,.05)` top hairline, soft drop shadow. Every card in the app uses this. Flat single-color cards are gone.
- Volt CTA recipe: volt fill, dark text, 18px radius, uppercase 800, outer glow `0 0 34px rgba(198,248,6,.28)`, active state scale(0.97) + volt-dim.
- Ghost button recipe: transparent, border-strong 1px, same radius and press behavior.
- Micro-label recipe: as defined in section 1.
- Tier pill recipe: hairline border pill, tier-colored glowing dot + text. Replaces flat badge blobs.
- Entrance stagger: sections rise 12px + fade over ~380ms ease-out, each delayed 60 to 80ms after the previous. One orchestrated entrance per screen.
- Press feedback: scale(0.96 to 0.97), ~120ms, on every tappable element app-wide.
- `prefers-reduced-motion`: all animation collapses to instant, exactly as the prototype does it.

---

## 3. The three prototyped screens (port exactly)

### 3.1 Landing
- No wordmark in the top corner on this screen. The 3D mark is the only logo.
- 3D hero: the "STACK." wordmark itself, extruded in 3D, exactly as in the prototype. Built with CSS 3D (no WebGL, no Three.js): a `perspective: 800px` container, the front face in Archivo Expanded 900 uppercase at ~54px with `white-space: nowrap` (the volt rounded-square period must never wrap to its own line; it is part of the lockup), glowing on the front face only, and ~16 aria-hidden depth layers stepped back via `translateZ` at ~2.2px per layer, gray ramp on the letters, dark-volt ramp on the period. Copy the values from the prototype's `buildDepth` function.
- Critical implementation warning: never apply a CSS `filter` (or `opacity < 1`, or `overflow: hidden`) to the element carrying `transform-style: preserve-3d`. Filters force the browser to flatten the 3D context and the extrusion disappears. This exact bug shipped once already.
- Motion rule (founder directive): the wordmark rests in a fixed 3D pose (rotateX 16deg, rotateY -14deg) so the depth is always visible, like a product shot. It NEVER auto-rotates or idles. It tilts only in response to pointer/touch movement (small offsets around the base pose, lerped) and eases back to the base pose on release/leave. Never eases back to flat. Reduced-motion: static base pose, no tilt.
- Tagline "SHOW UP. EVERY DAY." as a secondary line at ~32px, single line, words entering staggered (~130ms apart), "EVERY DAY." in volt with a soft text glow.
- Wordmark volt period pulses once after the sequence.
- CTAs and footer exactly as prototyped. Bilingual: Spanish strings carry the same weight and layout without overflow (test both).

### 3.2 Home
- Ring: 270px, 16px stroke, round caps, volt with `drop-shadow(0 0 10px rgba(198,248,6,.75))`, draws from 0 to value over ~850ms ease-out via stroke-dashoffset, percentage counts up simultaneously at 84px. Faint radial volt ambience behind it. Wire to real weekly consistency data.
- Streak card: 64px volt extruded numeral (layered text-shadow values from the prototype), count-up on mount, redesigned tier pill.
- Volt "Check in" CTA with glow.
- Segmented All Activity / Groups control with the sliding thumb.
- Feed cards with the full card recipe, avatar ring, watermark corner on photos, staggered entrance.
- Bottom nav: translucent + backdrop blur, hairline top border, raised volt camera button with glow ring and press scale, active tab volt dot.

### 3.3 Check-in celebration (final step of Prove it)
- "STACKED." slams in (scale spring), subtitle lists the groups posted to.
- Summary card rises in; streak numeral at 120px volt extruded, ticks up (+1) with a spring scale pop ~850ms in.
- Volt particle burst (~26 particles via Web Animations API, exactly as prototyped, fires once).
- Actions: "Share story card" (volt) and "Done" (ghost).
- Spanish: "STACKED." needs a Spanish counterpart with the same punch. Use the app's existing stackear vocabulary; do not translate literally. Founder reviews final copy.

---

## 4. Extending the system to every other screen

Apply the ported tokens, components, and motion vocabulary. Specific directives:

- **Groups**: cards use the card recipe plus a radial glow in each group's monogram color at ~10% opacity bleeding from the avatar. Active group gets a volt hairline + soft glow. Group names in display type. Empty state built around the summit-stack motif with one clear CTA.
- **Prove it (steps 1 and 2)**: horizontal slide between steps (250ms), animated progress bar, chips with the card depth recipe, selected chip = volt hairline + volt text + small spring pop. Preselect last-used groups and sport. Returning-user path to completion: three taps plus photo.
- **Profile**: stat tiles with count-up numerals in the numeral role (current streak volt). "The Stack" heatmap becomes the centerpiece: rounded cells, 5-step ramp from surface2 to volt (volt only at max), fast wave-in on first render (<600ms total), animated 3M/1Y segmented control, tap for date + count tooltip.
- **Leaderboard**: oversized rank numerals, current user row volt-hairlined, position changes animate.
- **Weekly recap**: editorial layout, one oversized headline stat in volt, everything else quiet.
- **Story cards**: regenerate with the new type system. Oversized Archivo Expanded numeral, grain, wordmark watermark, generous margins. Verify legibility on light and dark story backgrounds.
- **Chat, nudges, pacts, settings, auth forms**: token and component sweep, entrance stagger, press states, skeleton loaders. No screen ships untouched.

---

## 5. Verification protocol

1. Before any code: screenshot every route at 390px to `/screenshots/before/`.
2. After each screen: matching capture to `/screenshots/after/`, compared side by side.
3. Hard gate per screen: if the redesign is not instantly obvious from the pair, redo it before moving on.
4. Playwright preferred for capture (install if needed). If truly unavailable, verify computed styles and animation wiring in code and disclose it in the report.
5. Manually run the three core flows in a browser: full check-in (through celebration), group join, auth. In both EN and ES.
6. Final gates: typecheck, lint, build all pass clean.

---

## 6. Guardrails

- Feature branch only. Commit per screen or system.
- Zero functional regressions. Visual and motion changes only; touch logic only when a bug blocks the port.
- No destructive Supabase migrations, no `.env` changes, no route/endpoint/schema renames without an explicit flag for the native Capacitor track.
- Performance: no WebGL and no 3D libraries anywhere; the 3D wordmark is pure CSS transforms. All animation on transform/opacity only; grain and glows in CSS; Lighthouse Performance stays 85+ mobile.
- Accessibility: WCAG AA contrast, visible focus states, reduced-motion fully respected (the prototype shows how), 44pt touch targets.
- Mobile-first, touch-first throughout; this codebase becomes the native app.

---

## 7. Final report

- Before/after screenshot pairs for every route (paths listed)
- Confirmation the three prototype screens match the prototype, with any deviation listed and justified
- Font migration summary (files touched, BRAND.md updated, wordmark assets untouched)
- Per remaining screen: what the system extension changed
- Build gates and manual flow tests confirmed, EN and ES
- Anything flagged for the native track; anything deliberately deferred, with reasoning
