# Stack — Branding Implementation Guide

> Everything Claude Code needs to implement the Stack brand: the app icon, the wordmark logo, and the launch splash screen. Save this file as `STACK_BRANDING.md` in the root of the project, then point Claude Code at it.

---

## How to use this document

Save this file as `STACK_BRANDING.md` in your project root. Then in Claude Code, run:

> Read STACK_BRANDING.md in full and implement the entire brand system exactly as specified: the app icon and all its generated sizes, the wordmark logo component, and the launch splash screen. Show me the icon SVG and the splash screen first so I can confirm before you wire everything in.

The full implementation prompt is also included at the bottom of this document (Section 7) so you can paste it directly if you prefer.

---

## 1. The brand system

Stack has three brand assets, each with a clear job:

1. **The app icon** (the "summit stack" mark): used for the favicon, the iOS home-screen icon, and all PWA icons. This is the mark people tap.
2. **The wordmark** ("Stack." with a volt square period): used in the app header and anywhere the brand name appears as a logo.
3. **The launch splash** ("Stack." above "Show up. Every day."): the first thing a user sees when the app opens, before the content loads.

The thread that ties all three together is the volt accent (`#C6F806`): the summit of the icon, the period of the wordmark, and the accent on the splash are all the same green. That single color is the brand signature.

---

## 2. Color and type tokens

These already exist in the app from the build spec. The brand assets use this exact subset.

| Token | Hex | Used in branding for |
|-------|-----|----------------------|
| `bg` | `#0A0A0B` | Icon background, splash background |
| `surface` | `#141416` | Card surfaces behind small logo lockups |
| `volt` | `#C6F806` | Icon summit, wordmark period, splash accent |
| `text` | `#FAFAFA` | Wordmark text, splash text |
| `text-muted` | `#A1A1AA` | Splash subline |
| Icon gray (mid) | `#6E6E78` | Icon middle bar |
| Icon gray (dark) | `#3A3A40` | Icon bottom bar |

**Type:** `Geist` (already loaded in the app). Wordmark and splash use weight 800, tight letter spacing (`-0.02em`).

---

## 3. The app icon — "summit stack"

Three stacked, rounded horizontal bars climbing to a peak, centered on a near-black rounded square. The bottom bar is widest and darkest, the middle bar is medium, the top bar is narrowest and volt. It reads as a stack, as a climb, and as a summit reached.

### Master SVG (1024 x 1024, the source of truth)

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="230" fill="#0A0A0B"/>
  <rect x="212" y="614" width="600" height="104" rx="52" fill="#3A3A40"/>
  <rect x="322" y="460" width="380" height="104" rx="52" fill="#6E6E78"/>
  <rect x="422" y="306" width="180" height="104" rx="52" fill="#C6F806"/>
</svg>
```

### Proportion rules (do not change)
- Canvas 1024 x 1024, corner radius 230.
- Three bars, each 104 tall, 52 corner radius, with 50 vertical gaps between them.
- The three-bar block is centered vertically (spans y 306 to 718) and each bar is centered horizontally.
- Bar widths climb: bottom 600, middle 380, top 180.
- Bar colors: bottom `#3A3A40`, middle `#6E6E78`, top `#C6F806`.

### Required generated assets
From the master SVG, generate:
- `favicon.svg` and `favicon.ico` (browser tab).
- `icon-192.png` and `icon-512.png` (PWA standard).
- `icon-maskable-512.png` (PWA maskable: same mark, the near-black background fills the full square edge to edge so the platform can mask it; the bars already sit inside the safe zone, so no change to the mark is needed).
- `apple-touch-icon.png` at 180 x 180 (iOS add-to-home-screen).

### A note on the living icon (later, not now)
The top bar is the volt summit on purpose. In a future phase, the in-app icon or a notification badge can show the top bar lit volt only when the user has checked in today, and dimmed when the streak is at risk. Leave a `// PHASE 2` comment noting this. Do not build it now.

---

## 4. The wordmark logo

The word "Stack" in Geist 800, white, with the period rendered as a small volt **square** (not a round dot), sitting on the baseline after the "k".

### Implementation (build as a reusable component)
Build a `Wordmark` component that renders the text as live type (so it stays crisp at any size) with the period as a small square element in volt. Props: a `size` prop (sm, md, lg) and an optional `showPeriod` default true.

Reference styling:
- Text: `Stack`, Geist, font-weight 800, color `#FAFAFA`, letter-spacing `-0.02em`.
- Period: a small square, side roughly 0.16 of the font size, color `#C6F806`, corner radius about 18 percent of its side, baseline-aligned, with a small left margin (about 0.04em) after the "k".

Use the live-type version in the app header and anywhere the logo appears over a solid background. Keep an SVG export available for places that need a fixed asset (social cards, README), but the live component is the primary.

---

## 5. The launch splash screen

The first thing the user sees when the app opens. Near-black full screen, the wordmark centered, and "Show up. Every day." directly below it, exactly like the lockup that already exists.

### Layout
- Full-screen, background `#0A0A0B`.
- Vertically and horizontally centered.
- The `Wordmark` component at large size (the same "Stack." with the volt square period).
- Below it, the tagline "Show up. Every day." in Geist, weight 600 to 700, color `#FAFAFA` (or `#A1A1AA` for a softer feel, pick the one that looks best against the wordmark), letter-spacing slightly tight, with comfortable spacing below the wordmark.
- The tagline is bilingual: English "Show up. Every day." and Spanish "Preséntate. Todos los días." driven by the existing i18n system.

### Behavior
- The splash shows on app launch / first load, then fades out into the app after a short, deliberate beat (roughly 1.2 to 1.6 seconds), or as soon as the initial auth/session check completes, whichever is appropriate. It should feel intentional, not like a slow loading screen.
- A subtle entrance: the wordmark fades and rises a few pixels over about 400ms, the tagline follows about 150ms after. Keep it fast and clean, matching the disciplined feel of the brand. Nothing bouncy.
- On subsequent in-session navigations it does not reappear. It is a launch moment, not a per-page loader.
- For the installed PWA, set the manifest `background_color` and `theme_color` to `#0A0A0B` so the native launch background matches the splash with no white flash.

---

## 6. Manifest and metadata

Create/confirm `manifest.json` in `/public`:
- `name`: "Stack"
- `short_name`: "Stack"
- `description`: "Show up. Every day." (bilingual handling can come later; English is fine in the manifest)
- `theme_color`: "#0A0A0B"
- `background_color`: "#0A0A0B"
- `display`: "standalone"
- `icons`: reference `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` with correct `sizes` and `purpose` (the maskable one gets `"purpose": "maskable"`).

Wire everything into the Next.js App Router via the metadata API in `app/layout.tsx`: `icons` (favicon, apple-touch-icon), `manifest`, and `appleWebApp` (with `statusBarStyle` set so the iOS status bar matches the dark theme).

---

## 7. The implementation prompt for Claude Code

Paste this directly if you are not having Claude Code read the whole file:

```
Implement the full Stack brand system per STACK_BRANDING.md.

1. APP ICON. Create the master icon as an SVG using these exact proportions: a 1024x1024 rounded square (corner radius 230) with background #0A0A0B, containing three stacked horizontal rounded bars (each 104 tall, corner radius 52, 50px vertical gaps, the block centered vertically spanning y 306 to 718, each bar centered horizontally). Bottom bar width 600 color #3A3A40, middle bar width 380 color #6E6E78, top bar width 180 color #C6F806. From this master, generate: favicon.svg and favicon.ico, icon-192.png, icon-512.png, a maskable icon-maskable-512.png (background fills edge to edge), and apple-touch-icon.png at 180x180. Put them in /public.

2. WORDMARK. Build a reusable Wordmark component that renders "Stack" in Geist weight 800, white (#FAFAFA), letter-spacing -0.02em, with the period rendered as a small volt (#C6F806) SQUARE (side about 0.16 of the font size, corner radius about 18 percent, baseline-aligned, small left margin). Add a size prop (sm, md, lg). Use it in the app header.

3. SPLASH SCREEN. Build a launch splash: full-screen #0A0A0B background, the Wordmark centered at large size, and the tagline below it, bilingual via the existing i18n ("Show up. Every day." / "Preséntate. Todos los días.") in Geist weight 600-700. The wordmark fades and rises a few pixels over ~400ms on entrance, the tagline follows ~150ms later. The splash shows on app launch then fades into the app after ~1.2-1.6s or when the initial session check completes, whichever fits. It must not reappear on in-session navigation. Avoid any white flash on load.

4. MANIFEST AND METADATA. Create /public/manifest.json with name "Stack", short_name "Stack", theme_color "#0A0A0B", background_color "#0A0A0B", display "standalone", and the icons referenced correctly (the maskable one with purpose "maskable"). Wire icons, manifest, and appleWebApp (dark status bar) into app/layout.tsx via the Next.js metadata API.

Show me the rendered icon SVG and the splash screen first, before wiring the rest in, so I can confirm the proportions and the feel. Keep everything driven by the existing design tokens. All user-facing text bilingual via the existing i18n system.
```

---

## 8. Manual steps (only you can do these)

After Claude Code finishes:
- Confirm the favicon appears in the browser tab (you may need a hard refresh to clear the old one).
- On your iPhone, open the deployed site in Safari, tap Share, then Add to Home Screen, and confirm the summit-stack icon appears and the app opens full-screen with the dark splash and no white flash.
- If the old icon is cached, deleting and re-adding the home-screen shortcut forces the new one.

---

Built for Nico Zamora C.
