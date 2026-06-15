# Stack

> A fitness accountability app for small private groups. Show up. Every day.

Stack is a private accountability app for small crews (2–8 people). Every day
you work out, you check in with a photo taken inside the app. Your group sees it
instantly. Your streak grows. Miss a day and everyone knows.

Built with Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
(Postgres, Auth, Realtime, Storage). Fully bilingual (English / Spanish).

---

## Setup

### 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project
values (Supabase dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`NEXT_PUBLIC_BASE_URL` is used to build shareable invite links. Set it to your
deployed domain in production.

### 2. Run the database schema

In the Supabase dashboard → **SQL Editor** → New query, paste the entire
contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**. This:

- creates all tables (`profiles`, `groups`, `group_members`, `checkins`,
  `reactions`) with indexes,
- enables Row Level Security with working, non-recursive policies,
- adds the realtime publication for the live feed,
- creates the **private `checkins` storage bucket** and its access policies.

The script is idempotent — safe to re-run during development.

> Why the schema differs slightly from the spec's SQL: the spec's
> `group_members` read policy referenced its own table, which Postgres rejects
> with "infinite recursion detected in policy". We use `SECURITY DEFINER` helper
> functions instead — same security intent, but it actually runs. See the header
> comment in `supabase/schema.sql` for the full list of deviations.

### 3. Disable email confirmation (recommended for Phase 1)

So that signup gives an immediate session and the two-tap flow works, turn email
confirmation **off** for now:

Supabase dashboard → **Authentication → Sign In / Providers → Email** → toggle
**Confirm email** off. (With it on, new users must confirm via email before they
can log in; the signup screen will tell them to check their inbox.)

### 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint

---

## Build status (Phase 1)

- [x] **1.** Project setup + design system (tokens, fonts, core components)
- [x] **2.** Auth + onboarding
- [x] **3.** Database schema + storage
- [x] **4.** Group creation + joining
- [x] **5.** Check-in flow
- [x] **6.** Home feed + realtime
- [x] **7.** Streak logic (`lib/streaks.ts`, unit-tested via `npx tsx lib/streaks.test.ts`)
- [x] **8.** Profile + heatmap
- [x] **9–10.** Bilingual + polish pass

All Phase 1 acceptance criteria pass. Phase 2+ features (stakes, chat, push,
trainer dashboard) are intentionally not built — hooks are left in the data
model and code where they'll slot in.

Built by Nico Zamora C.
