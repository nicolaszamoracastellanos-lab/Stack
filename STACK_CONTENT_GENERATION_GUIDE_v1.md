# Stack Content Generation Guide
**Version 1.0 · Companion to the Stack Social Media Marketing Plan**
Product: Stack (stack-app.online) · Private small-group fitness accountability

This is the execution manual. The marketing plan says what to post. This says how to make it without breaking the brand or leaking a real user's data.

---

## Brand Tokens

### Palette

| Token | Hex | Use |
|---|---|---|
| Background | `#0A0A0B` | Every canvas, every frame, every slide. Stack lives on near-black. |
| Volt (accent) | `#C6F806` | The single emotional accent. CTAs, the summit peak, the wordmark period, one highlight per frame. |
| Volt dim | `#9BC400` | Pressed and hover states only. Rarely appears in marketing. |
| Surface | `#141416` | Cards |
| Surface 2 | `#1C1C1F` | Raised cards |
| Border | `#26262A` | Hairlines |
| Border strong | `#3A3A40` | The lowest stack bar in the icon |
| Text | `#FAFAFA` | Primary text and the wordmark |
| Text muted | `#A1A1AA` | Secondary text |
| Text dim | `#5C5C66` | Tertiary |
| Danger red | red family | **At-risk streak alerts only. Nowhere else, ever.** |

**Volt discipline:** volt is never a background fill for a large area. One volt element per frame, two at absolute most. If a design has volt in three places it is wrong. The accent works because it is scarce.

### Typography

| Context | Typeface | Applies to |
|---|---|---|
| **New content (default)** | **Archivo Expanded, Black 900** | All new marketing assets, thumbnails, title cards, carousels, video type. This is the redesign spec and it is what new content follows. |
| Legacy | Geist 800 | Earlier asset batches and the shipped wordmark PNGs. Do not mix Geist and Archivo Expanded inside a single asset. |
| Body and captions | Geist or system sans, regular to medium | Secondary text under a display headline |

Headlines are tight-tracked, all sentence case, heavy weight, large. Stack headlines look like a statement, not a caption.

### Marks
- **Summit-stack icon:** three rounded bars climbing to a volt peak on a near-black rounded square. The top bar is volt and it is the natural element to light up or pulse in motion.
- **Wordmark:** "Stack." in heavy weight, `#FAFAFA`, followed by the volt square period. The period is part of the mark. Never drop it, never recolor it, never separate it onto its own line.
- Source files: `wordmark-3200-transparent.png` and `wordmark-1600-transparent.png` for hero and video, `wordmark-watermark-transparent.png` for the in-photo check-in watermark, `icon-2048-transparent.png` for large frames, `icon-1024-on-dark.png` for standalone. Use the SVG sources wherever a tool accepts vector.

### Aesthetic keywords
Dark, intense, high contrast, disciplined, private, gym-at-6am, no-nonsense, quietly serious, one point of electric green in a black room.

Not: pastel, wellness, soft gradient, corporate SaaS, cheerful, playful, glassmorphic, motivational-poster.

### Never-list
1. **Never use red** for anything except at-risk streak alerts. Not CTAs, not accents, not thumbnails, not error states in marketing visuals, not "urgency" framing.
2. **Never use em dashes** in any copy, caption, subtitle, headline, or email. Periods, commas, colons, parentheses.
3. **Never expose the top-tier internal streak tier name** in any user-facing surface, including marketing. If it appears in a screen recording, that frame does not ship. Confirm the exact string with Nico before the first UI clip.
4. **Never generate fake Stack UI.** No AI-rendered app screens, no mockups of screens that do not exist, no invented metrics on a fake dashboard. Real screen recordings only.
5. **Never recolor volt.** Not a lighter green, not a yellow-green, not a gradient.
6. **Never show a public feed, follower count, discovery surface, or public profile.** Stack does not have these and implying it does misrepresents the product.
7. **Never machine-translate Spanish.** ES copy is written, not converted.
8. **Never post a real user's name, face, avatar, group name, or group description without explicit consent.**
9. **Never claim App Store availability, TestFlight access, Apple Health integration, or health-verified check-ins** until Apple enrollment and the HealthKit privacy copy (EN and ES) are both confirmed complete.
10. **Never use light backgrounds.** Stack does not have a light mode in its brand presentation.

### Copy-paste brand block

Paste this at the top of every generation prompt, in every tool.

```
BRAND: Stack (stack-app.online). Private small-group fitness accountability app.
Tagline: "Show up. Every day." / ES: "Preséntate. Todos los días."
Spanish verb form: stackear.

PALETTE (strict):
- Background: #0A0A0B (near-black). Every frame lives on this.
- Accent: #C6F806 (volt green). Used sparingly, one element per frame maximum.
- Text: #FAFAFA. Muted text: #A1A1AA.
- Surfaces: #141416 and #1C1C1F. Hairlines: #26262A.
- RED IS FORBIDDEN. Red is reserved exclusively for in-app at-risk streak
  alerts and must never appear in marketing, CTAs, accents, or backgrounds.

TYPE: Archivo Expanded, Black 900, for all display and headline text.
Sentence case. Tight tracking. Heavy and large.

MARKS: "Stack." wordmark in #FAFAFA with a volt (#C6F806) square period,
period always attached. Summit-stack icon is three rounded bars climbing to
a volt top bar on near-black.

AESTHETIC: dark, high contrast, disciplined, intense, private. Not wellness,
not pastel, not corporate, not playful.

COPY RULES: No em dashes anywhere. All user-facing copy is bilingual EN/ES,
Spanish written natively, never machine-translated. Never show public feeds,
follower counts, or public profiles. Stack has none of those.
```

---

## Tool-to-Asset Map

| Asset type | Primary tool | Why | Backup |
|---|---|---|---|
| TikTok and Reels video (real product) | Phone screen recording plus native editor | Real footage is non-negotiable and no tool renders truthful Stack UI | iPhone screen recording plus CapCut |
| Talking-head TikTok | Phone, partner-filmed | The existing production habit. Do not over-engineer it | Solo phone on a tripod |
| Cinematic B-roll and abstract brand video | Higgsfield (`cinematic_studio_video_v2`) | Connected, on Plus plan, raw assets already produced | Stock plus type over black |
| Brand still images and hero frames | Higgsfield (`cinematic_studio_2_5`) | Connected, brand-consistent when the block is enforced | Claude Design, then export via Canva |
| Carousels, title cards, quote cards | Canva MCP | Connected. Multi-page layout with brand kit, fast iteration | Claude Design (export path: Send to Canva, Share, Download for PNG) |
| App Store screenshots and framed device shots | Canva | Precise sizing and repeatable templates | Figma-style manual composition |
| Static social graphics | Canva | Fastest path to on-brand output | Python plus Pillow locally |
| Video assembly and audio | Local ffmpeg, or CapCut | Higgsfield pipeline is currently blocked on audio | CapCut with a licensed track |
| Copy, specs, and captions | Claude, using the brand block | Bilingual, brand-aware, EN/ES parity | None |
| Tracking and reporting | Notion (Mission Control, Build Tracker) | Source of truth for the project | None |
| Waitlist email | Resend on the Hostinger domain | DKIM, SPF, MX already verified, Supabase integration live | None |

**Claude Design PNG export path:** Send to, then Canva, then Share, then Download. The Export tab only offers PDF, PPT, and HTML. This trips people up every time.

---

## MCPs Connected and How to Use Them

Connected and relevant: **Canva**, **Higgsfield**, **Notion**, **Google Drive**, **Gmail**, **Spotify**. Canva and Higgsfield are the two that make assets.

### Canva

Best for: carousels, quote cards, title cards, App Store screenshot frames, anything with type on a layout.

**Copy-paste prompt, belief carousel:**
```
[PASTE BRAND BLOCK]

Create a 5-page Instagram carousel, 1080x1350.

Page 1: Full bleed #0A0A0B. Headline in Archivo Expanded Black 900, #FAFAFA,
centered, large: "Your group chat is not a gym plan." Small "Stack." wordmark
bottom left with the volt square period. Nothing else on the page.

Page 2: Same background. Headline: "47 messages. Zero workouts."
Body line beneath in #A1A1AA at 40% of the headline size.

Page 3: "Discipline is not the problem. Being unwatched is."

Page 4: "Stack is a private feed for 3 to 8 people who will notice the second
you stop."

Page 5: "Show up. Every day." in #FAFAFA with a single volt (#C6F806)
underline bar beneath it. "stack-app.online" in #5C5C66 at the bottom.

Constraints: no red anywhere. Volt appears exactly twice across all five
pages. No em dashes. Generous negative space. No icons, no illustration,
no photos.
```

**Copy-paste prompt, title card for a TikTok:**
```
[PASTE BRAND BLOCK]

Create a single 1080x1920 vertical title card.
Background #0A0A0B. Headline in Archivo Expanded Black 900, #FAFAFA,
positioned in the upper third with wide margins: "Day 12 of building an app
so my friends stop flaking."
Bottom of frame: "Stack." wordmark, small, with the volt square period.
No other elements. No red. One volt element total on the card.
```

**Canva notes:** set the Stack brand kit once (`list-brand-kits`, then confirm the palette and fonts are loaded) so every generation inherits the tokens. Export PNG for social. Do not let Canva auto-suggest color accents, it reaches for warm tones and will introduce red or orange if given room.

### Higgsfield

Best for: cinematic B-roll, abstract brand motion, hero frames. Not for UI. Never for UI.

**Two operational quirks that cost real time if forgotten:**

1. **Run a cost preflight on any new asset type.** Before generating a format you have not generated before, call the tool with `get_cost: true` first. Credits vary by model and asset type and this avoids burning a batch on a miscalculated run.

2. **Override the dark-theme preset interception.** Pass `declined_preset_id: '24bae836-2c4a-48e0-89b6-49fcc0b21612'` on every call. Higgsfield intercepts dark-themed prompts and applies its own dark preset, which fights Stack's palette (it pushes toward blue-black and washes the volt). Stack's background is already `#0A0A0B` by design. Decline the preset and control the darkness yourself.

**Models:** `cinematic_studio_2_5` for images, `cinematic_studio_video_v2` for animation. Plus plan.

**Copy-paste prompt, brand B-roll:**
```
[PASTE BRAND BLOCK]

Generate a 9:16 vertical cinematic clip, 4 seconds, no text.

Scene: a dark gym before opening. Near-black environment, #0A0A0B in feel.
A single overhead fixture throws a narrow pool of cold light on a rubber
platform. Loaded barbell on the floor, chalk dust suspended in the beam.
Slow push-in, handheld, shallow depth of field. No people in frame.
Color grade: crushed blacks, desaturated, one small accent of electric
yellow-green (#C6F806) from a distant EXIT-style light source at the edge
of frame.

Absolutely no red, no orange, no warm tungsten. No text overlays. No logos.
No people. No gym-bro aesthetic, no motivational lighting.
```

Parameters for the call: `declined_preset_id: '24bae836-2c4a-48e0-89b6-49fcc0b21612'`, aspect ratio 9:16, and `get_cost: true` first if this is a new asset type.

**Copy-paste prompt, hero still:**
```
[PASTE BRAND BLOCK]

Generate a 9:16 still. Near-black studio void. A stack of three matte
rounded bars resting on each other, ascending in size from bottom to top,
the smallest top bar glowing electric yellow-green (#C6F806) as if lit from
within. The two lower bars are neutral grey (#3A3A40 and #6B6B75), matte,
non-reflective. Single hard key light from upper left, deep shadow.
Product-photography realism, not illustration.

No red. No text. No background gradient. No floor reflection.
```

**Current Higgsfield status:** raw assets for the promo video exist. The pipeline is blocked on audio (voiceover plus music). Decision needed by day 22 of the campaign: record Nico's voiceover, license a track, or ship a 15-second silent typographic cut. Do not carry this into a third month.

### Notion
Log every shipped asset to the Build Tracker with pillar, channel, and date. The Do now view drives the week. Mission Control (MISSION CONTROL, NOV 27) is the source of truth, not this document.

---

## The Non-Negotiable Real-Footage Workflow

Stack's entire credibility with the tertiary build-in-public audience, and most of its credibility with crew captains, rests on the product being visibly real. An AI-rendered app screen destroys that in one frame, permanently, and it will be spotted.

**The rule: every frame of Stack UI is a real screen recording from a real build. No exceptions, no "just for the thumbnail," no Higgsfield UI, no Canva mockups of screens.**

### What gets recorded
1. The consistency ring filling (Home)
2. A check-in posting into a group feed, with reactions landing
3. The Prove it flow, all three steps, including the sport picker and the group picker
4. The at-risk streak alert firing (the only red that ever appears in Stack content)
5. The EN/ES toggle flipping the interface
6. The shareable card generating
7. Streak and tier surfaces on the Profile screen

### Recording standard
- iPhone screen recording, portrait, no rotation mid-capture
- Do Not Disturb on before recording. A notification banner in frame kills the take and can leak a name
- Battery above 40% (a red low-battery indicator in the status bar violates the red rule and looks unpolished)
- Record 3 to 5 seconds of lead-in and lead-out so the edit has room
- Record from a stable build. For the redesign, record from the Vercel preview URL, not an in-flight local branch that may change before merge

### Sanitize checklist, run before the file leaves the device

The current screens contain real personal data. This is not hypothetical. Every item below appears in existing captures.

| Check | What to look for |
|---|---|
| Real member names | "Nico Zamora", "@nico", "Andres O.", first names in feeds and leaderboards |
| Profile photos | Real faces in avatars, including in the feed and group rows |
| Group names | "ZC", "Test", "Ctoma", "Proyecto lipo", "Chichis" |
| Group descriptions | These are private in-jokes written for a private audience. "De gorda a guapa", "Ctoman buenas decisiones también", "Wedding prep". None of these should ever appear in public marketing. Rename before recording |
| Check-in photos | Real gym photos, real interiors, receipts, documents, mirrors with reflections, anything with a face or an address |
| Notes field content | Free text written by real users |
| Personal bio text | "Trying to be the best version of myself", "5 trainings a week hopefully more", "Lose fat". Personal goal language belongs to the user, not the campaign |
| The top-tier streak tier name | Never exposed in user-facing surfaces. It must not appear in marketing either. Confirm the exact string and scan for it |
| Status bar | Time, carrier, low battery, notification badges |
| Invite codes and links | Anything that grants access to a real group |

### The clean approach
Create a dedicated demo account with demo groups before the recording session. Neutral group names ("Morning crew", "Lunes a viernes", "The 6am"), placeholder avatars, and photos Nico owns. Populate it with realistic but synthetic activity. Record everything from that account.

This is faster than sanitizing after the fact and it removes the risk entirely. The one exception is content where the point is that these are real people (Pillar 3, Crew Stories), and that content requires explicit consent from the specific humans on screen, per group.

**If in doubt about a frame, cut the frame.** A slightly worse video is always cheaper than a friend seeing their private group description on TikTok.

---

## Prompt Engineering Rules

1. **Paste the brand block every single time.** Every tool, every session, every prompt. Models do not carry brand state across calls and will drift toward generic wellness aesthetics within two generations.
2. **State the aspect ratio explicitly in every prompt.** 9:16 for TikTok and Reels, 1080x1350 for Instagram carousels, 1:1 only if there is a specific reason. Never let a tool default.
3. **Change one variable at a time.** If a generation is close but wrong, change the lighting or the composition or the color, not all three. Otherwise you cannot tell what fixed it and the next asset starts from zero.
4. **Write negative constraints explicitly.** "No red, no warm light, no people, no text overlay, no gradient." Models add what you did not forbid. Red in particular is the default accent for "intensity" and "fitness" and it will appear unless you exclude it by name.
5. **Describe the emotion, then the mechanics.** "Disciplined, private, before anyone else is awake" gets closer than a list of adjectives about color.
6. **Never ask a generator to render Stack UI.** If a prompt contains a phone screen, an app interface, a dashboard, or a chart, stop and use a real screen recording instead.
7. **Generate copy in Spanish natively.** Prompt in Spanish for Spanish output. Do not generate English then ask for a translation, it produces stiff copy that a native speaker will clock immediately.
8. **Check every output for em dashes** before it ships. Generators insert them constantly.
9. **Keep a winners file.** When a prompt produces something good, save the exact string with its parameters. Reuse beats reinvention and it keeps the visual language consistent across weeks.
10. **Preflight new asset types with `get_cost: true`** on Higgsfield before running a batch.

---

## Weekly Batch Session

Total marketing budget is 2 hours per week across both active tracks (TikTok as the engine, Instagram pre-launch as the finishing sequence). The batch is 75 minutes of that. Everything else is distributed.

### Sunday, 75 minutes

| Time | Block | Output |
|---|---|---|
| 0:00 to 0:10 | **Shot list** | Pull four pieces from the calendar. Write the hook line for each. No script beyond the hook. |
| 0:10 to 0:25 | **Screen capture** | Record 3 fresh clips from the live build. Run the sanitize checklist immediately, before anything else. |
| 0:25 to 0:50 | **Film with partner** | Four talking-head or hybrid TikToks. Two takes each, maximum. Move on. |
| 0:50 to 1:05 | **Cut and caption** | Rough cuts, hook in the first 1.5 seconds, captions in the dominant language of each video. |
| 1:05 to 1:15 | **Bilingual pass and schedule** | Second-language caption for the first comment. Schedule the week. Log all four to the Notion Build Tracker. |

### Distributed, 45 minutes across the week
- **Threads, 15 minutes total:** one short post per weekday, written from what actually happened in the build. Never batched, batching flattens the voice.
- **Comment replies, 15 minutes:** first 60 minutes after each TikTok posts, in whatever gaps exist. This is the highest-return time in the whole plan.
- **Friday review, 15 minutes:** log numbers, pick next week's single experiment.

### Rules for the batch
- If the partner is unavailable, shoot screen-recording-plus-voiceover pieces solo. The channel does not skip a week.
- Bank a two-week buffer of edited clips so one missed Sunday does not create a gap.
- If the batch runs long, cut the fourth video. Do not extend into build time.
- Instagram is reformat only. It never gets its own filming session.

---

## Quick-Reference Asset Sizes

**9:16 is the default. Design for it first, crop out of it second.**

| Placement | Dimensions | Ratio | Notes |
|---|---|---|---|
| **TikTok video** | 1080 x 1920 | 9:16 | Primary format. Keep type inside the middle 70% vertically, the UI eats the top and bottom |
| **Instagram Reels** | 1080 x 1920 | 9:16 | Same master file as TikTok. Export separately, never cross-post with a watermark |
| **TikTok and Reels cover** | 1080 x 1920 | 9:16 | Headline in the upper third, clear of the caption overlay |
| **Instagram feed carousel** | 1080 x 1350 | 4:5 | Belief carousel format |
| **Instagram feed single** | 1080 x 1350 | 4:5 | 4:5 outperforms 1:1 for reach |
| **Instagram Story** | 1080 x 1920 | 9:16 | Interactive stickers in the middle third |
| **Threads image** | 1080 x 1350 | 4:5 | Screenshots post natively at whatever size, no reformat needed |
| **YouTube Shorts** | 1080 x 1920 | 9:16 | Same master as TikTok, defensive posting only |
| **LinkedIn** | 1200 x 627 | 1.91:1 | Monthly at most |
| **iPhone screen recording** | 1170 x 2532 or 1290 x 2796 | ~9:19.5 | Taller than 9:16. Crop to 1080x1920, do not letterbox with black bars, the background is already black and it reads as a mistake |
| **App Store screenshots (later)** | 1290 x 2796 | 6.7 inch | Not needed until Apple enrollment resolves |

**Safe zones:** on TikTok, keep critical type out of the bottom 20% (caption and profile UI) and the right 15% (action rail). On Reels, keep it out of the bottom 25%.
