# Stack — Update Batch 3: Shareable Story Cards + Check-in Redesign

> Turning Stack's check-in into a high-quality, shareable Instagram-story moment for ANY sport, fixing image quality, and moving to 9:16 vertical. Save as `STACK_BATCH3.md` in the project root and point Claude Code at it.

---

## How to use this document

Save as `STACK_BATCH3.md` in your project root. In Claude Code:

> Read STACK_BATCH3.md in full and build it section by section, confirming each works before the next. Use existing design tokens, the existing i18n system (every string EN and ES), and the Supabase CLI migration workflow for schema changes. Show me the new check-in flow and the story-card templates before wiring sharing.

---

## The vision for this batch

Strava lets runners share a slick story card with their distance and pace. But Stack is not a cardio app, it is a fitness social platform for ANY sport: soccer, padel, pickleball, ping pong, lifting, hybrid, whatever. The opportunity is a shareable 9:16 story card that works for all of it, overlaying the sport, the focus, the notes, the streak, and the date onto a crisp photo, branded with Stack so every share spreads the app. This is the organic growth engine.

Three things ship in this batch: (1) a redesigned check-in flow with details and photo in a user-chosen order, (2) a real fix to image quality and a move to 9:16 vertical everywhere, and (3) the shareable story-card generator with customizable templates, save-to-camera-roll, and share.

---

## 1. Redesigned check-in flow

Rework the check-in into a clean multi-step flow. The user can choose the order of the two phases (details first or photo first), defaulting to details-first so the details can be burned onto the photo.

**Phase A — Details:**
- **Groups (multi-select with "Select all"):** choose which groups to post to. Add a prominent "Select all groups" option so the user doesn't tap them one by one. At least one required.
- **Sport (searchable, large list):** the full modern sport list already in the app (running, cycling, swimming, lifting, soccer, basketball, padel, pickleball, ping pong, CrossFit, Hyrox, yoga, climbing, boxing, etc., plus Other with free text). Required.
- **Environment:** Indoor / Outdoor. Required.
- **Focus:** the intent of the session. Options: improve strength, build muscle, improve endurance, improve speed, improve efficiency, sweat, burn fat, recovery, skill/technique, competition prep, AND add new lighter options: "just for fun" and "to win" / "para ganar". Required.
- **Notes (optional):** a friendly journal field prompting "How did it go? How did you feel? What did you do?" Example placeholder: "Played midfielder today, scored twice." Attached to the check-in and available to the card.

**Phase B — Photo:**
- Take the photo in-app (high quality, see Section 2) at 9:16 vertical framing.
- Cropper/framing for 9:16.

**Order toggle:** let the user choose whether Phase A or Phase B comes first, and remember their preference. Default details-first.

After both phases, go to the story-card step (Section 3) before posting.

## 2. Image quality fix + 9:16 everywhere

The current photos are low quality. Fix the capture pipeline and move to vertical.

**Fix image quality:**
- Capture at full device resolution. When using getUserMedia, request high ideal video constraints (e.g., ideal width/height targeting the device's capability, not a small default) and use the rear camera (facingMode "environment").
- Consider the file-input capture approach (`<input type="file" accept="image/*" capture="environment">`) as an alternative or fallback, since it often yields full native camera resolution more reliably than a getUserMedia video frame grab on mobile Safari. Recommend the approach that gives the crispest result and explain the tradeoff.
- Account for device pixel ratio so the captured canvas isn't downscaled.
- Export at high JPEG quality (around 0.9) or WebP; do not re-compress multiple times.
- Preserve resolution through the Supabase upload, no silent downscaling in the pipeline.
- Target a crisp, high-resolution result that looks good full-screen on a phone.

**Move to 9:16 vertical:**
- The check-in photo is captured and stored at 9:16 (story) aspect ratio.
- The in-app feed displays photos vertically (9:16) too, not square. Update the feed item cards and the profile photo grid to the vertical format, keeping the layout clean and scrollable.
- Keep the existing Stack watermark on the photo (the one that already works), now adapted to the 9:16 frame.

## 3. The shareable story card

After the photo, generate a 9:16 shareable story card overlaying the workout details on the photo, branded Stack.

**Generation approach:**
- Build each card as real HTML/CSS (a styled React component) and convert it to a high-resolution PNG using a proven HTML-to-image approach (html-to-image or satori/@vercel/og style rendering). Real HTML gives crisp text, web fonts, and full design control, far better than hand-drawing on a canvas. Render at 2x or 3x pixel density for a sharp 1080x1920 output. Recommend the specific library and explain the choice; ensure it works on iOS Safari.

**What goes on the card (customizable):**
The user can select what to show. Available elements, all toggleable:
- The photo (background).
- Sport + environment (e.g., "Soccer · Indoor").
- Focus (e.g., "To win").
- A line from the notes (e.g., "Played midfielder today, scored twice").
- The current streak (e.g., "12 day streak 🔥").
- The date.
- The Stack watermark/branding (always present, see below).
Default to a clean, legible subset; let the user toggle elements on/off. Do NOT show which groups it was posted to on the card.

**Templates (presets the user picks from):**
Start with these, selectable before sharing:
1. **Minimal:** photo full-bleed, a small clean detail strip at the bottom, subtle branding.
2. **Bold:** strong type, sport and focus large, high-contrast scrim.
3. **Stat-heavy:** photo with streak, date, sport, focus, and notes all laid out cleanly.
4. **Photo-focused:** the image is the hero, just a small watermark and one detail line.
Plus **milestone/streak specials:** when the check-in hits a streak milestone (7/14/30/60/100/365), offer a celebratory template variant ("30 days. No misses.") that's extra shareable. Architect templates as a set so more can be added later. Make the system extensible.

**Overlay legibility:** use gradient scrims (a dark gradient at the bottom/top behind text), text shadows, and adequate contrast so details are always readable over any photo. This is critical for sport photos with busy backgrounds.

**Branding placement:** the Stack wordmark or summit-stack icon sits in a consistent spot (e.g., a corner or the bottom), visible enough to spread the app but not spammy. Every shared card advertises Stack.

## 4. Save and share

After the card is generated, two actions, both available (the user chose "save AND share"):
- **Save to camera roll:** reliably save the 1080x1920 PNG to the phone. Use the Web Share API with a file where supported, and a direct download fallback. Make it work on both iOS Safari and Android Chrome.
- **Share:** trigger the Web Share API (`navigator.share` with the image file) to open the native share sheet, from which the user picks Instagram, WhatsApp, etc.

**Honest constraint to handle gracefully:** a web app / PWA cannot deep-link directly into the Instagram Stories composer the way a native app can. The realistic flow is: generate card -> save to camera roll and/or open the native share sheet -> user posts to their Instagram story themselves. Design the UI around this: a clear "Saved to your photos, now post it to your story" confirmation plus the share-sheet button. Do not promise a one-tap-to-Instagram-story that the platform can't deliver. If `navigator.share` with files is unsupported on a given browser, fall back to save + instructions.

## 5. Data and posting

- The check-in posts to all selected groups with the photo and all details (sport, environment, focus, notes), as today.
- Store the user's template preference and their preferred check-in order.
- The story card is generated client-side from the check-in data; it does not need to be stored unless you want a share history (optional, can be Phase 4).
- Schema changes via CLI migration. New fields as needed (e.g., focus already exists from Batch 2; add any template/order preference fields).

## Guardrails — not in this batch

Do not build: payment/stakes rails, trainer tools, wearable integrations, in-app Instagram posting (impossible from PWA, do not fake it), or a server-side render farm for cards (client-side generation is enough at this scale). Leave `// PHASE 4` comments where hooks would go.

## Acceptance

- The check-in flow has a details phase and a photo phase, order user-selectable, with "select all groups," the full sport list, environment, focus (including "just for fun" and "to win"), and the notes field.
- Photos are visibly high quality and captured/stored at 9:16; the feed and profile grid display vertical photos cleanly.
- After a check-in, a 9:16 story card generates at 1080x1920, sharp, with the photo, toggleable details (sport, environment, focus, notes line, streak, date), and Stack branding.
- The user can pick from at least four templates, plus a milestone variant when a streak milestone is hit.
- The user can save the card to their camera roll AND open the native share sheet, working on iOS Safari and Android Chrome, with graceful fallback and honest copy about posting to Instagram themselves.
- Overlay text is legible over any photo.
- Everything bilingual, schema via CLI migration, dark + volt aesthetic consistent.

Built for Nico Zamora C.
