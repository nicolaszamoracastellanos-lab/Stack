# Stack — App Store & Google Play Deployment Runbook

This is the end-to-end guide to getting the native Stack app (in
[`mobile/`](mobile/)) onto the **Apple App Store** and **Google Play**. It
assumes you're starting from zero — no developer accounts yet.

The app uses [EAS Build](https://docs.expo.dev/build/introduction/), so you can
build **and submit the iOS app without owning a Mac** — Apple builds run on
Expo's cloud macOS machines.

> Legend: 🧑‍💻 = something you must do in a browser/account (can't be automated
> from code), ⌨️ = a terminal command.

---

## 0. One-time prerequisites

1. ⌨️ Install the EAS CLI and log into (or create) a free Expo account:
   ```bash
   npm install -g eas-cli
   eas login          # creates an account if you don't have one
   ```
2. ⌨️ Set the Supabase keys the app builds with. For local dev, copy
   `mobile/.env.example` → `mobile/.env`. For cloud builds, push them as EAS
   env vars (so they're inlined into the binary):
   ```bash
   cd mobile
   eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<proj>.supabase.co" --environment production
   eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>" --environment production
   ```
3. ⌨️ Initialize the EAS project (writes a real `projectId` and `owner` into
   `app.json`, replacing the `REPLACE_WITH_...` placeholders):
   ```bash
   cd mobile
   eas init
   ```
4. 🗄️ Apply the new database migration so native push tokens have a home. In
   the Supabase dashboard → SQL Editor, run
   [`supabase/migrations/20260619120000_device_push_tokens.sql`](supabase/migrations/20260619120000_device_push_tokens.sql).

---

## 1. Apple — App Store

### 1a. Enroll in the Apple Developer Program (🧑‍💻, ~$99/year)

1. Create an Apple ID with two-factor auth if you don't have one.
2. Go to <https://developer.apple.com/programs/enroll/> and enroll as an
   **Individual** or **Organization** (Organization needs a D-U-N-S number and
   takes longer). Pay the $99 annual fee. Approval is usually minutes to a day.
3. Note your **Apple Team ID** (developer.apple.com → Membership).

### 1b. Create the app record in App Store Connect (🧑‍💻)

1. Go to <https://appstoreconnect.apple.com> → **Apps** → **+** → **New App**.
2. Platform: iOS. Name: **Stack**. Primary language: English.
   Bundle ID: **`online.stackapp.mobile`** (matches `app.json`; register it
   first under Certificates, IDs & Profiles → Identifiers if prompted).
   SKU: `stack-ios`.
3. Copy the **App Store Connect App ID** (the numeric `ascAppId`).

### 1c. Build (⌨️, no Mac needed)

```bash
cd mobile
eas build --platform ios --profile production
```
EAS will offer to **generate the iOS Distribution certificate and provisioning
profile for you** — say yes; it stores them on Expo's servers. It will also set
up the **APNs key** for push (or run `eas credentials` to manage it).

### 1d. Submit to review (⌨️)

Fill the three iOS placeholders in [`mobile/eas.json`](mobile/eas.json)
(`appleId`, `ascAppId`, `appleTeamId`), then:
```bash
eas submit --platform ios --profile production --latest
```
Then in App Store Connect: attach the build to the version, complete the
listing (§3), answer App Privacy (§4), add review notes + demo account (§5),
and click **Submit for Review**.

---

## 2. Google — Play Store

### 2a. Create a Google Play Developer account (🧑‍💻, ~$25 one-time)

1. Go to <https://play.google.com/console/signup> and pay the one-time $25.
2. For a **personal** account Google now requires identity verification and (for
   new personal accounts) a period of closed testing with ~12 testers before you
   can go to production — budget for this. An **organization** account skips the
   testing requirement but needs a D-U-N-S number.

### 2b. Create the app in Play Console (🧑‍💻)

1. Play Console → **Create app**. Name: **Stack**. Type: App. Free.
2. The package name **`online.stackapp.mobile`** is set on first upload.

### 2c. Firebase / FCM for Android push (🧑‍💻 + ⌨️)

Android push goes through Firebase Cloud Messaging:
1. Create a Firebase project at <https://console.firebase.google.com>, add an
   Android app with package `online.stackapp.mobile`.
2. Upload the **FCM V1 service-account JSON** to Expo so the Expo Push service
   can deliver to your app:
   ```bash
   cd mobile
   eas credentials      # Android → Google Service Account → upload the JSON
   ```
   (No `google-services.json` is needed in the repo when using Expo's managed
   push + FCM v1.)

### 2d. Build & submit (⌨️)

```bash
cd mobile
eas build --platform android --profile production      # produces an .aab
```
Put your Play service-account key at `mobile/play-service-account.json`
(see Play Console → Setup → API access), then:
```bash
eas submit --platform android --profile production --latest
```
First submission usually must go to the **internal testing** track (already set
in `eas.json`); promote to production from the Console once tested.

---

## 3. Store listing content

Ready-to-paste copy lives in [`mobile/store/`](mobile/store/):
- `listing-en.md` — name, subtitle, description, keywords, promo text.
- `screenshots.md` — required sizes and a shot list.

You must provide **screenshots** (no automation): capture from a device/simulator
running the app — at minimum a 6.7" iPhone set for Apple and a phone set for
Play. A 1024×1024 App Store icon and a 512×512 Play icon are derived from
`mobile/assets/icon.png`.

---

## 4. Privacy / data disclosures

Both stores require a privacy policy URL and a data-collection questionnaire.

- **Privacy policy:** [`mobile/store/privacy-policy.md`](mobile/store/privacy-policy.md).
  Host it somewhere public (e.g. `https://www.stack-app.online/privacy`) and use
  that URL in both stores.
- **What Stack collects (answer both questionnaires accordingly):** email
  (account), user content (check-in photos + notes), and a device push token.
  Data is stored in Supabase, not sold, and tied to the user's identity. No ad
  tracking, no third-party analytics SDKs.

---

## 5. Review notes & demo account

Apple (and often Google) review requires sign-in, so:
- Create a real demo account in the app and seed it into a group with a couple
  of check-ins.
- Put the credentials in App Store Connect → App Review Information, and in
  Play Console → app content notes.
- Note: "Camera is used to capture the daily workout check-in photo. Push
  notifications alert users to group activity and streak risk."

---

## 6. Updates after the first release

```bash
cd mobile
# bump the user-facing version in app.json ("version"); build numbers
# auto-increment via eas.json (autoIncrement / appVersionSource: remote).
eas build --platform all --profile production
eas submit --platform all --profile production --latest
```

JS-only changes can ship instantly via **EAS Update** (`eas update`) without a
store review, as long as native modules didn't change.

---

## Quick reference

| Thing | Value |
| --- | --- |
| iOS bundle id / Android package | `online.stackapp.mobile` |
| App display name | Stack |
| Apple cost | ~$99 / year |
| Google cost | ~$25 one-time |
| Mac required? | No (EAS builds iOS in the cloud) |
| Backend | Shared Supabase project with the web app |
| New migration to run | `supabase/migrations/20260619120000_device_push_tokens.sql` |
