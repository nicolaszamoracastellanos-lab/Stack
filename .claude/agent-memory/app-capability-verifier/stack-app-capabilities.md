---
name: stack-app-capabilities
description: Full capability inventory, test commands, fragile spots, and expected-behavior contracts for the Stack fitness app
metadata:
  type: project
---

## Stack App — Capability Inventory & Verification Notes

### Tech
Next.js 14 App Router, TypeScript, Supabase (anon + service role), Resend (email), vercel deploy at stack-one-tawny.vercel.app, bilingual EN/ES via lib/i18n.ts.

### Test commands
- `npx tsx lib/pact-eval.test.ts` — 5 tests (pact debt eval logic)
- `npx tsx lib/tiers.test.ts` — 9 tests
- `npx tsx lib/week.test.ts` — 16 tests
- `npx tsx lib/streak-quota.test.ts` — 14 tests
- `npx tsx lib/streaks.test.ts` — 18 tests
- `npx tsc --noEmit` — full type check (zero output = clean)
- `npm run build` — Next.js production build

### Capabilities verified (session 2026-06-26)

**1. Landing copy (app/page.tsx + lib/i18n.ts)**
- Footer: `landing_appstore` = "Soon on iOS and Android." (volt), `landing_credit` = "Created by the Stack team."
- Body: two paragraphs `landing_supporting` + `landing_supporting2` — both keys exist EN+ES
- Old copy ("Built by Nico Zamora C.") is absent

**2. PenaltyPopup + PenaltyNudge (components/PenaltyIntro.tsx)**
- PenaltyPopup renders in groups/new/page.tsx inside the `created` block (line 110)
- PenaltyNudge in GroupDetail.tsx gated on `isPact && isCreator && !(stake_value && who_pays)` (line 229–234)
- Dismissal via localStorage key `stack_penalty_nudge_dismissed_${groupId}`
- Both link to `/groups/[id]/pact`
- All penalty_* keys exist EN+ES

**3. Waitlist (components/WaitlistSignup.tsx, app/api/subscribe/route.ts)**
- Footer link expands to inline email form
- POST /api/subscribe → upsert with ignoreDuplicates → welcomeEmail best-effort
- Dedupe: second call returns `{ok:true}` without re-sending (ignoreDuplicates)
- Invalid email → 400
- All waitlist_* keys exist EN+ES
- Migration: supabase/migrations/20260623120000_waitlist.sql

**4. Onboarding email (app/api/welcome/route.ts, components/OnboardingFlow.tsx)**
- OnboardingFlow.finish() fires `void fetch("/api/welcome", ...)` after profile upsert (line 189)
- Route checks auth session; 401 unauthenticated (confirmed live)
- Send-once guard: `welcome_email_sent_at` column (migration 20260623130000_profile_welcome_email.sql)
- onboardingEmail contains: doLabel list, comingLabel section, founderNote, QUOTE (Phillip C. McGraw), signature

**5. Admin sender (app/api/admin/send-welcome/route.ts)**
- Token guard: `!token || provided !== token` → 404 (confirmed live)
- dryRun mode returns `{ok:true, mode:"bulk", dryRun:true, total:N, sent:N}`
- Confirmed live: correct token + dryRun → `{total:0,sent:0}` (empty DB at time of test)

**6. Founder signatures (lib/email.ts)**
- EN: `"— Nicolas Zamora C., Founder and CEO of Stack"`
- ES: `"— Nicolas Zamora C., Fundador y CEO de Stack"`

**7. Pact accountability system**
- `recordPactDebts` in lib/pact-actions.ts: upserts with ignoreDuplicates → calls notifyPactBreaks for newly-inserted rows only
- notifyPactBreaks: uses createAdminClient, one notifyMany call per distinct breaker
- pact_broken wired in: lib/push/types.ts (union), lib/push/copy.ts (BUILDERS entry with stake var), lib/notification-view.ts (DESC map + NotifData.stake), lib/i18n.ts (notif_desc_pact_broken EN+ES)
- buildNotification does NOT crash for pact_broken: BUILDERS[pact_broken] is defined
- group-detail.ts: checkins query selects `sport` (line 118), pactAlert computed with disciplineCounts gate, daysElapsed > restAllowance guard (lines 354-357)
- PactAlert renders BEFORE RecapCard (GroupDetail line 180 vs 188)
- "you" vs named variants: isYou check in PactAlert, behind_many uses behindNames.join(", ")

### Known issues / NEEDS-ATTENTION

**PactAlert missing "Settle the tab" link**: The `pact_alert_settle` i18n key exists in both EN+ES (i18n.ts lines 190 and 859), but PactAlert.tsx does NOT render it — no Link or button for settling from the alert banner. This is cosmetic/UX only; the StakesLedger component (below the pact section in GroupDetail) still provides the settle path.

**pact_broken notifications omit actorId**: The breaker is not passed as actorId, so self-suppression in notify() is disabled. This is INTENTIONAL per the comment in pact-actions.ts line 66 ("tell the WHOLE team including the breaker"), but worth noting as a design choice.

### Fragile spots
- pact_broken BUILDERS entry depends on `v.stake` being populated; if stake_value is null, falls back to "the stake" / "la apuesta" (safe fallback)
- admin route returns 404 when ADMIN_TASK_TOKEN is not set (intentional security-through-obscurity)
- welcomeEmail send-once guard relies on `welcome_email_sent_at` being null; if sendEmail fails, the column is not stamped → retry next onboarding finish (correct behavior)
