# Stack — Privacy Policy

_Last updated: 2026-06-19_

Stack ("we", "the app") is a private accountability app for small fitness
groups. This policy explains what we collect and why. Host this page at a public
URL (e.g. https://www.stack-app.online/privacy) and reference it in the App
Store and Google Play listings.

## What we collect

- **Account information:** your email address and password (passwords are
  handled by our authentication provider and stored only as a secure hash), plus
  your chosen username, display name, and optional profile details.
- **Content you create:** check-in photos and notes, group memberships, streak
  and check-in history, and reactions/comments.
- **Device push token:** if you enable notifications, a push token that lets us
  send notifications to your device.
- **Technical data:** basic information needed to operate the service (e.g.
  timestamps). We do **not** use third-party advertising or analytics SDKs and we
  do **not** track you across other apps or websites.

## How we use it

- To run the core service: authenticate you, show your group's feed, compute
  streaks, and store your check-in photos.
- To send notifications you've opted into (group activity, streak reminders).
- To keep the service secure and working.

## How it's stored and shared

- Data is stored in our backend provider, **Supabase** (Postgres + Storage).
  Check-in photos live in a **private** storage bucket and are only accessible to
  members of the group the check-in was posted to.
- Push notifications are delivered via **Expo's push service**, which relays to
  Apple (APNs) and Google (FCM).
- We do **not** sell your personal data. We don't share it with third parties
  except the infrastructure providers above, strictly to operate the app.

## Your choices

- **Notifications:** turn them off anytime in your device settings or in-app.
- **Your content:** you can delete your check-ins in the app.
- **Account deletion:** request deletion of your account and associated data by
  emailing the contact below; we will remove your profile, check-ins, photos,
  and push tokens.

## Children

Stack is not directed to children under 13 and we do not knowingly collect their
data.

## Contact

Questions or deletion requests: **hello@stack-app.online**
