# Stack — Mobile (iOS + Android)

A native [Expo](https://expo.dev) / React Native app for Stack. It talks
directly to the **same Supabase backend** as the web app (`stack-app.online`),
so accounts, groups, check-ins and streaks are shared across web and mobile.

This is a real native app — native navigation, native camera, native push — not
a web view wrapped around the site.

- **Framework:** Expo SDK 56 · React Native 0.85 · expo-router
- **Auth/data:** `@supabase/supabase-js` (session persisted in AsyncStorage)
- **Camera:** `expo-image-picker` + `expo-image-manipulator`
- **Push:** `expo-notifications` → Expo Push → APNs (iOS) / FCM (Android)

## What's implemented

The core daily loop plus the scaffolding the rest slots into:

- Email/password **auth** (sign in / sign up) against Supabase.
- **Home feed** for your active group, with realtime new-check-in updates and
  pull-to-refresh, plus your live personal **streak** (shared `streaks.ts`).
- Native **check-in**: take/choose a photo, add a note, pick which groups (or
  "just me"), upload to the private `checkins` bucket, post.
- **Groups**: list your crews, create a group (with invite code), join by code.
- **Profile**: avatar, streak, totals, longest streak, sign out.
- **Push registration**: stores the device's Expo push token in
  `device_push_tokens`; the web backend's send layer now delivers to it.

Not yet ported (tracked as follow-ups): chat, pacts/stakes, tiers, notification
center UI, onboarding tour, full bilingual copy, share cards. The pure logic for
most of these already lives in `src/lib` / the web `lib/` and can be reused.

## Run locally

```bash
cd mobile
cp .env.example .env          # fill in your Supabase URL + anon key
npm install
npx expo start                # then press i / a, or scan the QR in Expo Go*
```

\* Push notifications and some native modules require a **development build**
(`eas build --profile development`) or a store build — they don't work in Expo
Go or the iOS simulator.

## Build & ship

See [`../STACK_MOBILE_DEPLOY.md`](../STACK_MOBILE_DEPLOY.md) for the full
runbook: developer-account enrollment, EAS cloud builds (no Mac required for
iOS), push credentials, and store submission.
