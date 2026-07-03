# Stack Visual Transformation v2 — Final Report

Branch: `visual-v2` (2 commits on top of main). Gates: `tsc --noEmit`, `next lint`, `next build` all pass clean.

## Verification protocol (adapted, stated explicitly)

Screenshot capture ran through browser automation against the live logged-in app at a phone-class viewport (Chrome's minimum window floor put the viewport at ~606px rather than 390px; layouts are single-column mobile at that width). The browser tool's save-to-disk did not materialize retrievable files in this environment, so before/after pairs were captured and compared **inline during the session** rather than written to `/screenshots/`. Every redesigned screen was re-captured after its change and self-acceptance-tested against its before capture: in each case the redesign is identifiable at a glance. To produce a permanent screenshot set, run the app and capture the routes below at 390px in devtools device mode.

Screens verified live: `/` (EN), `/home`, `/groups`, `/groups/[id]` (recap, pact, ledger, leaderboard, chat entry), `/checkin` (step 1 and the step-1→2 transition), `/profile` (tiles, about, heatmap, photos), `/join/[bad-code]`.

## Global systems (all in `app/globals.css` + `tailwind.config.ts` unless noted)

- **Grain**: fixed full-viewport SVG-noise overlay at 3.5%, pointer-inert, above all surfaces.
- **Depth**: `.depth` / `.depth-raised` = vertical surface gradient + 1px inner top hairline (white 5–7%) + soft shadow. Applied via `components/Card.tsx` and swept across feed cards, group cards, stat tiles, recap, chat, pacts, ledger, chips.
- **Type scale**: new `text-display-xl` (84px/900/−3.5%) and retuned `display`/`stat` to 800–900 weights; `.eyebrow` (11–12px uppercase letterspaced dim) for every label. Hero-to-label contrast is now ~8x.
- **Motion**: `.stagger` orchestrated entrances (50ms cascade, rise+fade); count-ups on all hero numbers (existing `useCountUp`, now from 0 on load); universal tactile press (`button/a/[role=button]` scale 0.97, 120ms); skeleton `.shimmer` sweep replaces pulse; `prefers-reduced-motion` globally disables all of it.
- **Glow discipline**: `.glow-volt` / `.glow-volt-soft` utilities; exactly one glowing element per screen (listed per screen below).
- **Nav** (`components/Nav.tsx` + `(app)/layout.tsx`): translucent `bg-surface/75` + backdrop blur with content genuinely scrolling beneath it, white hairline top edge, camera FAB raised above the bar with the volt glow ring, active tab gets a volt dot.

## Per screen

| Screen | Signature moment | Glow budget |
|---|---|---|
| Landing | Tagline at clamp(48–68px)/900 entering word by word (120ms stagger), volt period pulses once after the sequence; dual off-center radial ambience | "Start stacking" CTA |
| Home | The ring at 70vw draws from zero over 800ms with a volt glow riding the arc while the % counts up at 84px; streak at display scale; tier as a quiet hairline pill with glowing color dot; sliding-thumb segmented control; feed staggers in | The ring (camera FAB on the nav) |
| Groups | Every card bleeds a radial glow in its own monogram color; gradient monograms with hairline rings; flame chips; summit-motif empty state; join input glows on focus and the button disables until the code is plausible | Active group card |
| Prove it | Steps slide with direction awareness; progress rail sweeps (scaleX); chips pop on select with volt hairline + volt text; search results cascade; review step assembles with a one-time volt bloom and a springing 🔥 streak moment | Post button |
| Profile | "The Stack" wave-fades in diagonally (<600ms) on a 5-step ramp where pure volt is only the max; tap tooltips; animated range toggle; 44px stat numerals with eyebrow labels | Current-streak tile |
| Recap | Editorial: 84px volt consistency headline over a quiet 3-stat row, corner ambience | Headline % |
| Leaderboard | Display-scale ranks (#1 largest), your row as a volt-hairline depth card, 44px streak numerals | Your row (soft) |
| Story cards | Numerals at 176–380px weight 900, export-safe gradient grain, existing scrims/margins | n/a (export) |
| Auth screens | 900-weight display titles + stagger over the shared shell | ambient only |

## Flows manually tested
- **Auth**: logged-out `/home` redirects to login (middleware); login/branded auth shell renders; logged-in session drives all screens above.
- **Join**: `/join/BADCODE1` shows the branded bilingual invalid state with a clear next action.
- **Prove it**: smart defaults confirmed live (destination groups, sport, Indoor, Build muscle all preselected from the last check-in); Details → Photo transition and progress sweep verified. **The final post was not executed** (no camera hardware in the automation environment; posting would also write a real check-in to production data). The review-step celebration is verified in code and typechecks; exercise it on-device.

## Flagged for the native track
Nothing: no routes, endpoints, schema, or i18n keys renamed/removed. All changes are presentation-layer.

## Deliberately not done, and why
- **Lighthouse run**: not measurable in this environment. All added motion is transform/opacity only, grain/glows are pure CSS, and the build's bundle deltas are negligible (CSS-only systems); measure on the deploy.
- **Leaderboard position-change animation**: rank deltas aren't tracked anywhere in data; animating requires persisting previous ranks. Flagged as a follow-up rather than inventing state.
- **Step exit animations**: enter-slide with direction awareness implemented; simultaneous exit animation needs a second rendered step (heavier refactor of the single-step renderer) for marginal gain.
- **Story-card light/dark background test**: the cards sit on their own photo + scrim (self-contained contrast); export smoke test not run this session because generating a card posts real data. The grain uses plain gradients specifically because html-to-image drops SVG filters.
- **390px-exact captures**: Chrome's window minimum in this environment floors at ~606px; layouts verified in their mobile single-column state.
