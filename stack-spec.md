# Stack — Phase 1 Build Specification

> A fitness accountability app for small private groups. Show up. Every day.
> This document is the complete build brief for Phase 1. Hand it to Claude Code as the source of truth.

---

## How to use this document

Save this file as `STACK_SPEC.md` in the root of your project folder. Then open Claude Code in that folder and tell it:

> Read STACK_SPEC.md in full, then build Phase 1 exactly as specified. Ask me clarifying questions before writing code if anything is ambiguous. Build it section by section, starting with project setup and the design system, and confirm each section works before moving to the next.

This is better than pasting a wall of text because Claude Code can re-read the file at any point during the build and stay aligned.

---

## 1. The vision

Stack is a private accountability app for people who struggle to show up for the gym alone. You and a small group (2 to 8 people) hold each other accountable. Every day you work out, you check in with a photo taken inside the app. Your group sees it instantly. Your streak grows. Miss a day and everyone knows.

The emotional core of the product is the streak. You are not stacking workouts for a faceless app. You are stacking them in front of people who will notice the moment you stop. That social weight is the entire mechanic.

Phase 1 is the foundation: accounts, groups, the photo check-in, the live group feed, and the streak system. It must work end to end for two real users (the founder and one friend) and it must look and feel like a finished product, not a prototype.

### Design principles
- Dark and intense. This is not a soft wellness app. It is sharp, focused, and a little serious.
- Friction goes on quitting, not on checking in. Checking in is two taps. Skipping a day should feel costly.
- The streak is always visible. It is the first thing you see and the thing you protect.
- Bilingual from day one. Every string works in English and Spanish.
- Real-time. When your friend checks in, you see it without refreshing.

---

## 2. Tech stack (do not deviate)

- Framework: Next.js 14+ with App Router and TypeScript
- Styling: Tailwind CSS with a custom design token config
- Backend: Supabase (Postgres database, Auth, Realtime, Storage)
- Fonts: loaded via `next/font`
- Hosting target: Vercel
- State: React Server Components where possible, client components only where interactivity requires it
- No additional UI libraries. Build the components custom so the aesthetic is fully owned.

Environment variables (create `.env.local` with these, left empty for the user to fill):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 3. Design system

Build this first, as a real token system in `tailwind.config.ts` and a global stylesheet. Every screen pulls from these tokens. No hardcoded hex values inside components.

### Color palette

| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#0A0A0B` | App background, near black |
| `surface` | `#141416` | Cards, the feed items, inputs |
| `surface-2` | `#1C1C1F` | Elevated surfaces, modals, active states |
| `border` | `#26262A` | Default hairline borders |
| `border-strong` | `#3A3A40` | Hover and focused borders |
| `text` | `#FAFAFA` | Primary text |
| `text-muted` | `#A1A1AA` | Secondary text, labels |
| `text-dim` | `#5C5C66` | Tertiary text, timestamps, hints |
| `volt` | `#C6F806` | Primary accent. Streak alive, primary actions, the live signal |
| `volt-dim` | `#9BC400` | Accent hover and pressed |
| `danger` | `#FF4D4D` | Streak broken, destructive actions, the "you missed" state |
| `danger-dim` | `#CC3D3D` | Danger hover |

The accent `volt` is the soul of the brand. Use it sparingly and with intent: the live streak number, the primary check-in button, the active state of the day. When the streak is broken or at risk, the accent flips to `danger`. That single color change carries the whole emotional story of the app.

### Typography

Load two fonts via `next/font/google`:
- `Geist` for all UI text (clean, modern, native to the Vercel ecosystem)
- `Geist Mono` for numbers, streak counts, and timestamps (gives the data a precise, intense feel)

Type scale:
- Display (streak number, hero): 64px, weight 700, Geist Mono, tight letter spacing
- H1: 32px, weight 700
- H2: 24px, weight 600
- Body: 16px, weight 400, line height 1.6
- Label: 14px, weight 500, `text-muted`
- Caption: 12px, weight 400, `text-dim`

All copy is sentence case. Never title case, never all caps except for the wordmark treatment if desired.

### Spacing and shape
- Base unit: 4px. Use multiples (4, 8, 12, 16, 24, 32, 48, 64).
- Border radius: 12px for cards, 10px for inputs and buttons, 9999px for pills and avatars.
- Borders: 1px hairlines using the `border` token. Borders define structure in this dark UI more than shadows do.
- Shadows: avoid heavy shadows. Use subtle elevation through `surface-2` background shifts instead.

### Motion
- Transitions: 150ms ease for hover and state changes.
- The streak number animates up with a quick count when it increments.
- New feed items slide in from the top with a 200ms fade.
- Keep all motion subtle and fast. Nothing bouncy. This app is disciplined.

### Core components to build
Build these as reusable components in `components/`:
- `Button` (variants: primary on volt, secondary outline, danger, ghost)
- `Input` (dark, hairline border, volt focus ring)
- `Card` (surface background, hairline border, 12px radius)
- `Avatar` (initials on a colored circle, fallback when no photo)
- `StreakBadge` (the number with the flame or stack icon, color-driven by state)
- `FeedItem` (the check-in card: avatar, name, photo, note, timestamp, reaction)
- `Nav` (bottom tab bar on mobile widths, side nav on desktop)
- `LanguageToggle` (EN / ES switch)

---

## 4. Information architecture

Phase 1 screens, in build order:

1. Landing page (`/`) — public marketing page
2. Sign up (`/signup`)
3. Log in (`/login`)
4. Onboarding (`/onboarding`) — set username after first signup
5. Home (`/home`) — group selector and the live feed, the main screen of the app
6. Create group (`/groups/new`)
7. Join group (`/join/[code]`) — landing target for an invite link
8. Check in (`/checkin`) — camera capture flow
9. Profile (`/profile`) — personal streak, full check-in history heatmap

A logged-out user hitting any protected route redirects to `/login`. A logged-in user with no username redirects to `/onboarding`. A logged-in user with no group sees an empty state on `/home` prompting them to create or join a group.

---

## 5. Data model

Create `supabase/schema.sql` with the full schema below, including row level security. Security is not optional, even in Phase 1. Build it correctly now.

```sql
-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- GROUPS
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  goal text,
  invite_code text unique not null,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- GROUP MEMBERS
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

-- CHECKINS
create table checkins (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  photo_url text not null,
  note text,
  created_at timestamptz default now()
);

-- REACTIONS (simple kudos on a checkin)
create table reactions (
  id uuid default gen_random_uuid() primary key,
  checkin_id uuid references checkins(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  emoji text default 'fire',
  created_at timestamptz default now(),
  unique (checkin_id, user_id)
);

-- Enable row level security on everything
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table checkins enable row level security;
alter table reactions enable row level security;

-- POLICIES
-- Profiles: anyone authenticated can read, you can only edit your own
create policy "profiles readable by authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);
create policy "users insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Groups: members can read their groups, anyone authenticated can create
create policy "members read their groups" on groups
  for select using (
    exists (select 1 from group_members where group_members.group_id = groups.id and group_members.user_id = auth.uid())
  );
create policy "authenticated create groups" on groups
  for insert with check (auth.uid() = created_by);

-- Group members: you can read membership of groups you belong to, you can join
create policy "read membership of own groups" on group_members
  for select using (
    exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
  );
create policy "users join groups" on group_members
  for insert with check (auth.uid() = user_id);

-- Checkins: members of a group can read all checkins in it, you create your own
create policy "members read group checkins" on checkins
  for select using (
    exists (select 1 from group_members where group_members.group_id = checkins.group_id and group_members.user_id = auth.uid())
  );
create policy "users create own checkins" on checkins
  for insert with check (auth.uid() = user_id);

-- Reactions: readable by group members, you create your own
create policy "members read reactions" on reactions
  for select using (
    exists (
      select 1 from checkins c
      join group_members gm on gm.group_id = c.group_id
      where c.id = reactions.checkin_id and gm.user_id = auth.uid()
    )
  );
create policy "users create own reactions" on reactions
  for insert with check (auth.uid() = user_id);
create policy "users delete own reactions" on reactions
  for delete using (auth.uid() = user_id);
```

### Storage
Create a Supabase Storage bucket named `checkins` for the photos. Set it to private. Add a storage policy that allows authenticated users to upload to it and allows group members to read photos for check-ins in their groups. Generate signed URLs for displaying photos in the feed, or use the public URL pattern if simpler for Phase 1 (note the tradeoff in code comments).

### A note on the trigger
Create a Postgres trigger or a Supabase Edge Function so that when a new user signs up via auth, a `profiles` row is created automatically. If that is too complex for the first pass, handle profile creation in the `/onboarding` flow instead and document the choice.

---

## 6. Internationalization

Create `lib/i18n.ts` with a translations object. Every user-facing string in the entire app lives here, keyed, with `en` and `es` values. No hardcoded strings in components.

Structure:
```typescript
export const translations = {
  en: {
    landing_tagline: "Show up. Every day.",
    landing_cta_signup: "Start stacking",
    landing_cta_login: "Log in",
    checkin_button: "Check in",
    streak_label: "day streak",
    streak_broken: "Streak broken",
    // ... every string
  },
  es: {
    landing_tagline: "Preséntate. Todos los días.",
    landing_cta_signup: "Empieza a sumar",
    landing_cta_login: "Iniciar sesión",
    checkin_button: "Registrar",
    streak_label: "días seguidos",
    streak_broken: "Racha rota",
    // ... cada texto
  }
}
```

Build a `useLanguage` hook and a context provider. Default to English. Persist the choice in localStorage. The `LanguageToggle` component switches it instantly across the app. Write real, natural Spanish, not machine-translated Spanish. The Spanish should feel native to a Latin American user.

---

## 7. Screen specifications

### 7.1 Landing page (`/`)
A bold, dark, single-screen marketing page.
- The wordmark "Stack" large and white, with the period or a short underline in volt.
- The tagline below it: "Show up. Every day." (translated).
- One line of supporting copy: something about holding your crew accountable, building the streak, no excuses.
- Two buttons: "Start stacking" (primary, volt) and "Log in" (secondary).
- A language toggle in the top corner.
- Intense, minimal, lots of negative space. The kind of page that makes someone want to screenshot it. Think of the energy of a premium training brand, not a clinical health app.

### 7.2 Sign up (`/signup`)
- Email and password fields, dark styled, volt focus rings.
- A "Start stacking" submit button.
- On success, create the auth user and redirect to `/onboarding`.
- Link to `/login` for existing users.
- Handle and display errors clearly (email taken, weak password) in both languages.

### 7.3 Log in (`/login`)
- Email and password fields.
- On success, redirect to `/home` if the user has a username, otherwise `/onboarding`.
- Link to `/signup`.
- Clear error states.

### 7.4 Onboarding (`/onboarding`)
- Single field: choose a username (and optionally a display name).
- Validate uniqueness against the `profiles` table.
- On submit, create or complete the profile row, then redirect to `/home`.

### 7.5 Home (`/home`) — the heart of the app
This is the screen people open every day. It must be excellent.

Layout, top to bottom:
- A header with the current group name and a group switcher (if the user is in more than one group). If the user is in no group, show an empty state with two large buttons: "Create a group" and "Join a group."
- The streak header: the user's current personal streak as a large Geist Mono number with the `streak_label`, colored volt if the streak is alive (checked in today or the streak is unbroken) and danger if the streak is broken or at risk. Next to it, show the group collective streak (consecutive days where every member checked in).
- A prominent "Check in" button if the user has not checked in today. If they have already checked in today, replace it with a calm confirmation state ("You showed up today") in volt.
- The live feed: a reverse-chronological list of `FeedItem` cards for everyone in the group. Each item shows the member's avatar and name, their check-in photo, the optional note, a relative timestamp, and a reaction button (the fire emoji). Tapping the reaction adds or removes a reaction in real time.
- The feed updates in real time using Supabase Realtime subscriptions on the `checkins` and `reactions` tables. When a group member checks in, their card appears at the top with a subtle slide-and-fade animation, no refresh needed.

### 7.6 Create group (`/groups/new`)
- Fields: group name (required), goal (optional, example placeholder "Wedding prep, November 27").
- On submit: generate a short unique invite code (6 to 8 uppercase alphanumeric characters), insert the group, insert the creator into `group_members`, redirect to `/home` with that group active.
- After creation, surface the shareable invite link prominently: `https://[domain]/join/[code]` with a one-tap copy button and the raw code shown as well. This is how the second user gets in, so make it impossible to miss.

### 7.7 Join group (`/join/[code]`)
- The landing target when someone opens an invite link.
- Look up the group by code. If found, show the group name and goal and a "Join this group" button.
- If the user is not logged in, send them through signup or login first, then return them to the join flow and complete the join.
- On join: insert into `group_members`, redirect to `/home` with that group active.
- Handle invalid or expired codes gracefully.

### 7.8 Check in (`/checkin`) — the core action
This flow must be fast and feel good. Two taps from intent to done.
- Open the device camera using the browser MediaDevices API (`getUserMedia`). Show a live camera preview.
- A large capture button takes the photo in-app. No uploading from the camera roll. The photo is proof, captured in the moment.
- After capture, show a preview with a retake option and an optional short note field ("How did it go?").
- A "Stack it" submit button uploads the photo to the `checkins` Storage bucket, creates the `checkins` row tied to the active group and the user, and redirects to `/home` where the new check-in is already at the top of the feed and the streak has incremented (with the count-up animation).
- Handle camera permission denial with a clear message and a fallback explanation.
- The whole flow should take a few seconds. Optimize for speed and zero friction.

### 7.9 Profile (`/profile`)
- The user's avatar, display name, and username.
- Their all-time personal streak and their longest streak.
- A check-in history heatmap: a calendar grid, one cell per day, colored volt on days they checked in, dim on days they did not, in the style of a GitHub contribution graph. This is the visual representation of the stack growing over time and it should look great. It is the thing people will want to screenshot and share later.
- Total check-ins count.
- A log out button and the language toggle.

---

## 8. Streak logic

Streaks are the emotional engine. Implement them carefully.

- A personal streak is the number of consecutive days, ending today or yesterday, on which the user has at least one check-in. If the user checked in today, the streak includes today. If their last check-in was yesterday, the streak is alive but today is still open. If their last check-in was two or more days ago, the streak is broken and resets.
- Compute streaks from the `checkins` table by date (use the user's local date, be careful with timezones, default to the device timezone for Phase 1 and note the limitation in a comment).
- The group collective streak is the number of consecutive days on which every current member of the group checked in. One member missing a day breaks the collective streak. This is the social pressure mechanic and it should be prominent.
- Surface streak state visually: volt when alive, danger when broken, and a distinct "at risk" treatment when the streak is alive but the user has not yet checked in today (for example, the number in volt but a subtle danger-colored prompt nearby).

Write the streak calculation as a clean, well-commented utility function in `lib/streaks.ts` with unit-testable logic. Do not bury it in a component.

---

## 9. Guardrails — what NOT to build yet

To keep Phase 1 focused and shippable, do not build any of the following. They are later phases. Architect the data model and code so they can slot in cleanly later, but do not implement them now.

- No stakes, betting, or money. (Phase 2)
- No milestone card image generation. (Phase 3)
- No group chat. (Phase 2)
- No trainer dashboard or workout program board. (Phase 4)
- No push notifications. (Phase 2)
- No wearable integrations of any kind. The photo check-in is the only proof mechanic in Phase 1.
- No payment processing or subscriptions. (Phase 5)

If you find yourself tempted to add any of these, stop and leave a clear `// PHASE 2` style comment marking where the hook would go, then move on.

---

## 10. Setup, run, and acceptance

### Setup steps the build should produce
1. A working Next.js project that runs with `npm run dev`.
2. A `.env.local` template with the two Supabase variables.
3. The complete `supabase/schema.sql` ready to paste into the Supabase SQL editor.
4. Clear instructions in a `README.md` for: filling in env vars, running the schema, creating the storage bucket, and starting the app.

### Acceptance criteria for Phase 1 (the build is done when all of these pass)
- A new user can sign up, set a username, and land on an empty home screen.
- That user can create a group and see a shareable invite link.
- A second user can open the invite link, sign up, and join the same group.
- Either user can check in by taking a photo in-app, and it appears in the feed for both users in real time.
- The personal streak increments correctly and shows the right color state.
- The group collective streak reflects both members checking in.
- A user can react to a check-in and the reaction appears for the other user in real time.
- The profile heatmap shows check-in history accurately.
- Every screen works in both English and Spanish via the language toggle.
- The app is fully responsive: it looks intentional and polished on a phone browser and on desktop.
- The dark, intense aesthetic is consistent across every screen, driven entirely by the design tokens.

---

## 11. Deployment

Once Phase 1 passes acceptance locally:
- Initialize a git repository and push to GitHub.
- Connect the repo to Vercel.
- Add the two Supabase environment variables in the Vercel project settings.
- Deploy. Confirm the live URL works end to end with the founder and one friend as the two real users.

The invite link in the create-group flow should use the deployed domain in production and localhost in development. Read the base URL from an environment variable.

---

## 12. Build philosophy

Build it section by section. Confirm each section works before moving on. Do not generate the entire app in one pass and hope. The order:

1. Project setup and the design system (tokens, fonts, core components).
2. Auth and onboarding.
3. The database schema and storage, wired up and tested.
4. Group creation and joining.
5. The check-in flow.
6. The home feed with real-time updates.
7. Streak logic.
8. The profile and heatmap.
9. Bilingual pass: confirm every string is translated.
10. Polish pass: responsiveness, animations, empty states, error states.

Make it something worth showing people. This is going to be documented in public.

Built by Nico Zamora C.
