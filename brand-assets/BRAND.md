# Stack — Brand Assets

Press / video kit for **Stack** (stack-app.online). Everything here is generated
from the app's source-of-truth SVGs via `scripts/brand-kit.mjs`.

> Stack is a private, small-group fitness accountability app. Tagline: **"Show up. Every day."**

---

## The mark

The app icon is a **"summit stack"**: three rounded bars climbing to a **volt
peak** on a near-black rounded square. The wordmark is **Stack** (Geist, weight
800) followed by a small **volt square**.

## Colors

| Token | Hex | Use |
|---|---|---|
| **Volt** (accent / soul of the brand) | `#C6F806` | the peak, highlights, CTAs |
| Volt dim | `#9BC400` | pressed/hover volt |
| Background (near-black) | `#0A0A0B` | app background, logo backdrop |
| Surface | `#141416` | cards |
| Surface 2 | `#1C1C1F` | raised cards |
| Border | `#26262A` | hairlines |
| Border strong | `#3A3A40` | the lowest stack bar |
| Text | `#FAFAFA` | primary text / wordmark |
| Text muted | `#A1A1AA` | secondary |
| Text dim | `#5C5C66` | tertiary |
| Danger (reserved for at-risk only) | red family | streak at-risk alerts |

**Theme:** dark, intense, high-contrast. Volt is used sparingly as the single
emotional accent — never as a fill for large areas.

---

## Files

### `icon/` — the app mark
| File | What | Best for |
|---|---|---|
| `icon-source.svg` | vector source (rounded icon) | infinite scaling, motion |
| `icon-2048-transparent.png` | 2048px, transparent | hero / large video frames |
| `icon-1024-transparent.png` | 1024px, transparent | overlays on any background |
| `icon-1024-on-dark.png` | 1024px on `#0A0A0B` | safe standalone logo |
| `icon-maskable-source.svg` / `icon-maskable-1024.png` | full-bleed (no rounded corners) | platform-masked / full-frame |
| `icon-512.png`, `icon-192.png`, `apple-touch-icon-180.png`, `favicon.ico` | shipped PWA/browser sizes | reference |

### `wordmark/` — the "Stack" lockup
| File | What | Best for |
|---|---|---|
| `wordmark-source.svg` | vector source | infinite scaling, motion |
| `wordmark-3200-transparent.png` | 3200px wide, transparent | hero / large video frames |
| `wordmark-1600-transparent.png` | 1600px wide, transparent | overlays |
| `wordmark-1600-on-dark.png` / `wordmark-on-dark.png` | on `#0A0A0B` | safe standalone wordmark |
| `wordmark-watermark-transparent.png` | white text + volt square, transparent | the in-photo check-in watermark |

---

## Quick guidance for video (Higgs Field)

- **Vector first:** use the `*-source.svg` files wherever the tool accepts SVG —
  they stay razor-sharp at any zoom/animation scale.
- **On dark:** the brand lives on `#0A0A0B`. Prefer the `*-on-dark` or
  transparent assets over light backgrounds.
- **Animate the peak:** the top bar of the icon is intentionally the volt
  "summit" — a natural element to light up / pulse in motion.
- **Don't recolor** the volt (`#C6F806`); it's the one accent that carries the
  brand.

Regenerate anytime with `node scripts/brand-kit.mjs`.
