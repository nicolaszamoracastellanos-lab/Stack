# Stack Elevation Pass v1 — Final Report

Branch: `elevation-pass-v1` (8 commits, never touched main). Executed per STACK_REDESIGN_MASTER_v1.md.
Verification: `tsc --noEmit`, `next lint`, and `next build` all pass clean on the final commit.

---

## 1. Issues found and their resolution

### P0 — raw errors reaching users (all FIXED)
| Where | Was | Now |
|---|---|---|
| signup, reset-password | raw Supabase auth `error.message` | bilingual `error_generic`, detail to console |
| OnboardingFlow (x2) | "Avatar upload failed: {msg}", "{code}: {msg}" | `error_upload_failed` / `error_save_failed` |
| ProfileEditForm (x2) | raw upload/save errors (comment admitted "debugging pass") | bilingual keys + console.error |
| CheckinFlow (x2) | raw upload/insert errors | bilingual keys + console.error |
| GroupDetail (x4) | raw errors AND literal RLS-policy debug strings shown in a toast | `action_failed`, debug detail to console |
| PactEditor (x2) | raw save/propose errors | `error_save_failed` |
| RemoveMemberButton | `window.alert` with raw DB error appended | Modal confirm + inline bilingual error |
| app/(app)/error.tsx | rendered `error.message` + digest, English-only | branded bilingual ErrorScreen |
| lib/checkins, lib/group-admin | returned raw `${code}: ${message}` strings up to the UI | return translatable codes; detail logged |
| API routes (subscribe, push/subscribe, pacts/cron, send-welcome) | raw `error.message` in JSON | generic error + server log |

Also ADDED (didn't exist at all): root `app/error.tsx`, `app/global-error.tsx` (static dual-language, inline styles so it survives a broken CSS pipeline), `app/not-found.tsx`. Unknown profile ids now `notFound()` instead of silently bouncing home.

### P1 — logic and correctness (all FIXED except where flagged)
- **Week inconsistency**: group detail used a rolling last-7-days window while the dashboard used Mon–Sun. Same member showed different weekly numbers on two screens, and the recap's "This week" shifted daily. Everything now uses the locked Mon–Sun week from `lib/week`.
- **UTC day-boundary bugs**: dashboard/group-detail "checked in today", weekly counts and window stats bucketed days in the server's frame (UTC on Vercel), not the member's stored timezone. Around midnight, non-UTC users' dots and counts flipped a day early/late. All member day-flags now resolve per-member timezone; the home ring and checked-in-today use the same frame as the streak beside them.
- **Pact last_place tie**: a full tie (including a week where everyone hit the goal) charged the ENTIRE group the stake. Now hitting the target is always safe. ⚠️ This is a money-logic change: review `lib/pact-eval.ts` before merging if any real ledger rows depend on old behavior. Old debts are not modified.
- **Recap fairness**: "perfect week" was hardcoded 7/7 and consistency divided by members x 7, so a 4x/week member could never be perfect and always dragged the group under 100%. Both are goal-aware now.
- **Unverified-email login** said "wrong email or password"; it now says to confirm the email, and verify-email has a resend button (30s cooldown).
- **Silent GoalSetup failure**: save errors just re-enabled the button; now surfaced.
- **Check-in double-submit**: a fast double-tap created two full duplicate posts; a ref guard closes it.
- **NudgeBanner orphaned**: the Batch 6 home rewrite deleted its only mount, so received nudges had NO in-app surface (the nudges table was written and never read). Re-mounted on Home.
- **No client-side validation** on signup/login/forgot (email format, password length); added, bilingual.

### P2/P3 — visual, UX, technical debt (fixed unless listed in §6)
- Zero loading states existed (no spinners, no skeletons, no loading.tsx anywhere) → Skeleton primitives + 7 route-level ghosts.
- Invisible keyboard focus on every button (`outline-none` with no ring) → volt focus ring on all primitives.
- Touch targets under 44pt (icon buttons 36px, bell 40px, share 28px, delete icons ~20px, toggle 28px, composer 40px) → all at/above 44pt via size or hit-area extension.
- Comments were the only non-optimistic social action → optimistic with reconcile/restore. Nudge button optimistic. NotificationCenter now updates live (INSERT channel with cleanup); chat read-receipts debounced.
- Watermark loader cached a rejected promise (one flaky fetch = unwatermarked posts all session) → retries.
- Posted feed image was a lossless PNG story card (multiple MB per daily post) → JPEG q0.9; share exports stay PNG.
- Home data waterfall + `getUserGroups` executed 3x per render → one parallel round + prefetched groups passed down. Group-detail ledger/proposals joined the parallel batch.
- Heatmap: aria-pressed toggle, grid exposed as one labeled image, empty-state nudge, tokenized axis type.
- Profile stat tiles count up on load; ring draws in from empty on load (the doc's "animate on load"); photo grid lazy-loads.
- Dead code deleted: Tour, EmptyGroupState, GroupSwitcher, lib/tour-steps + orphaned i18n keys (both languages). Dead `CheckinNoGroup` export removed.
- Middleware now guards all logged-in route prefixes (was 4 of 10).
- Manifest polish (lang/dir/orientation/categories). SW registration confirmed live (lib/push/client.ts).

### Checked and CLEAN (no action needed)
- **Internal tier name**: "Volt" is the intended public tier label; the protected internal *rationale* (lib/tiers.ts) does not leak into any user-facing surface. Verified across i18n, JSX, push copy, email.
- Streak engine (`lib/week.ts`, `lib/streak-quota.ts`): Monday-anchored, tz-injectable, correct break/at-risk/grace logic, unit-tested. No changes.
- Heatmap week alignment: already correct (Mon-anchored, local tz).
- Story card generation: robust (iOS warm-up pass, skipFonts retry, share-with-download fallback, consistent wordmark).
- No open-redirect on `next` params; no redirect loops in auth flow; join flow states thorough.

## 2. Before/after by major screen
- **Landing/auth**: same structure (already premium); now with inline bilingual validation, neutral (non-red) error banners, resend-confirmation path, and no raw errors.
- **Home**: ring animates in on load, streak counts up, nudge banner restored, unread indicators volt instead of alarming red, loads in fewer round-trips behind a skeleton ghost.
- **Groups/group detail**: weekly numbers finally agree with the dashboard and with each member's own home; recap is goal-aware and earns its place (empty weeks get a one-line nudge, not a wall of zeros); leave/delete/remove flows are neutral, modal-confirmed, 44pt.
- **Prove it**: sport/environment/focus prefill from last time (the 3 required daily pickers become confirm-taps), duplicate-post guard, posts upload ~10x lighter.
- **Profile / The Stack**: stat tiles animate, heatmap accessible + has an empty state, photos lazy-load, bad ids 404.
- **Chat/notifications**: live notification list, debounced read receipts, bilingual fallbacks.

## 3. Design system changes
- Tokens: `text-micro` (11px), `text-stat` (44px), `eyebrow` and `pressable` utilities. No palette changes.
- Button: focus ring, active scale on all variants, `sm` size, `pill` shape; danger variant restyled neutral (see judgment call below).
- New primitives: FormError, Callout, Badge (Dot/CountBadge), IconButton (44pt), Spinner, Skeleton/SkeletonCard, Modal (focus trap, Escape, scroll lock, sheet/center), ErrorScreen. The copy-pasted red banners (8 files), volt callouts (12 files), unread dots (5 files) and 36px icon buttons (4 files) now compose from these.
- Drift fixes: TierBadge undefined CSS-var fallback, Toggle magic offset + hit area, ImageCropper radii, redundant weights, off-scale micro text.

## 4. Verification
`npx tsc --noEmit` ✓ clean · `next lint` ✓ zero warnings · `next build` ✓ compiled, all routes emitted. Shared JS 87.4 kB; heaviest route (home) 199 kB first-load.

## 5. Flags for the native Capacitor track
- **No routes, API endpoints, or DB columns were renamed or removed.**
- New routes (additive): `/` error/not-found boundaries only (no nav impact).
- New migration `supabase/migrations/20260702120000_member_stats_batch.sql` (batch member-stats RPCs) is WRITTEN BUT NOT RUN. Additive + reversible. Apply it, then switch `lib/group-detail.ts` to the batch calls to kill the 2-RPCs-per-member pattern.
- `lib/group-admin.ts` `RemoveResult.error` changed from English strings to typed codes ("unauthorized" | "not_owner" | "self" | "failed") — internal to the web UI, but note if native reuses it.
- `LeaderEntry` gained `weeklyGoal`; `getCombinedFeed`/`getGroupsDashboard` gained an optional prefetched-groups param (backwards compatible).
- Pact `last_place` evaluation change (see §1). Cron sweep behavior changes for future weeks only.

## 6. Judgment calls and deliberately out of scope
**Judgment calls (per the doc's red rule, flag anything ambiguous):**
- The doc reserves red exclusively for at-risk streak alerts. I applied it strictly: form errors, destructive buttons, unread badges, and the broken-PACT alert all lost red (pact-broken now matches BrokenPactCard's deliberate warm-volt roast). Kept red: AtRiskAlert, broken-streak StreakBadge, leaderboard at-risk dot (only when there's a streak to lose). If you want red back for form errors (common UX convention), it's one change in FormError/Input.
- ES tagline stays "Preséntate. Todos los días." (already existed, carries the weight).
- "stackear" applied to the check-in verb everywhere; "sumar" kept only where it genuinely means adding people.

**Deferred, with reasons:**
- Feed realtime subscriptions (posts/reactions/comments live across clients): product/infra decision — needs a channel-per-group strategy and battery/connection budget in the Capacitor WebView. The stale comment claiming it existed is fixed.
- Feed pagination beyond limit(300): fine at current scale.
- `/api/subscribe` rate limiting: needs an infra choice (Vercel KV / upstash); endpoint is public by design.
- Pact weeks are Sun–Sat by design (ledger `period_key` compatibility) vs the app's Mon–Sun week. Documented internally; changing it would rewrite ledger history.
- Photo watermark PNG asset vs story-card live-text lockup: two constructions of the wordmark. Verify `public/wordmark-watermark.png` matches the current lockup; regenerate via scripts/generate-icons.mjs if not.
- About section stays visible when `show_stats` is off (it isn't stats) — confirm that's the privacy intent.
- Language hydrates from localStorage after first paint, so a returning ES user sees one frame of EN on the landing page. Fix needs a cookie-based SSR read of the language.
- Lighthouse not measured in this environment (needs a running browser against prod). Bundle numbers above suggest the 90+ target is reachable; measure on stack-app.online after deploy.
- Unit tests exist (`lib/*.test.ts`) but no `test` script runs them anywhere. Worth wiring into CI.
- Founder-only internal tooling kept its red styling (never user-facing).
