"use client";

import Link from "next/link";
import type { FounderEnv } from "@/lib/founder-env";
import type { TierKey } from "@/lib/tiers";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationsSection } from "@/components/founder/NotificationsSection";
import { OnboardingSection } from "@/components/founder/OnboardingSection";
import { SimulatorSection, type FounderEngine } from "@/components/founder/SimulatorSection";
import { DemoSection } from "@/components/founder/DemoSection";

/**
 * Founder/QA harness panel (STACK_FOUNDER_MODE). Internal tool — styled with a
 * loud "FOUNDER / QA" band so it's never mistaken for a user feature. Sections
 * are added incrementally per the spec's build order; each is independently
 * founder-gated on the server.
 */
export type AtRiskDiag = {
  timezone: string;
  serverTzTodayKey: string;
  weeklyGoal: number | null;
  quotaActiveFrom: string | null;
  quotaEraActive: boolean;
  todayKey: string;
  weekStartKey: string;
  weekWorkouts: number;
  daysLeftInclToday: number;
  needed: number | null;
  slack: number | null;
  workedToday: boolean;
  atRiskEligible: boolean;
  simActive: boolean;
};

export function FounderPanel({
  userId,
  isFounder,
  env,
  subCount,
  engine,
  diag,
  tierConfirmed,
  tierProvisional,
  simActive,
  snapshotTakenAt,
}: {
  userId: string;
  isFounder: boolean;
  env: FounderEnv | null;
  subCount: number;
  engine: FounderEngine;
  diag: AtRiskDiag;
  tierConfirmed: TierKey | null;
  tierProvisional: TierKey | null;
  simActive: boolean;
  snapshotTakenAt: string | null;
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      {/* Loud internal-tool banner */}
      <div className="mb-6 rounded-card border border-volt/50 bg-volt/10 px-4 py-3">
        <p className="font-mono text-caption font-bold uppercase tracking-widest text-volt">
          ⚙ Founder / QA — internal tool
        </p>
        <p className="mt-1 text-caption text-text-muted">
          Founder-only. Server-gated by <code>is_founder</code>. Actions touch
          only your own data.
        </p>
      </div>

      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-h2">Founder tools</h1>
        <div className="flex items-center gap-3">
          {/* §7 — instant EN/ES toggle (also localizes test notifications). */}
          <LanguageToggle />
          <Link href="/home" className="text-label text-text-muted hover:text-text">
            ← Home
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {/* A · At-risk diagnostic (read-only; computed in your timezone) */}
        <section className="rounded-card border border-volt/40 bg-bg p-5">
          <p className="text-caption font-medium uppercase tracking-wide text-volt">
            A · At-risk diagnostic (your timezone)
          </p>
          <dl className="mt-3 space-y-1 font-mono text-caption">
            <Row k="weekly_goal (Q)" v={String(diag.weeklyGoal)} ok={diag.weeklyGoal === 6 ? undefined : false} />
            <Row k="timezone" v={diag.timezone} />
            <Row k="today (local)" v={diag.todayKey} />
            <Row k="today (server/UTC)" v={diag.serverTzTodayKey} />
            <Row k="week_start (Mon)" v={diag.weekStartKey} />
            <Row k="quota_active_from" v={diag.quotaActiveFrom ?? "(null)"} />
            <Row k="quota era active" v={String(diag.quotaEraActive)} />
            <Row k="workouts this week" v={String(diag.weekWorkouts)} />
            <Row k="days remaining (incl today)" v={String(diag.daysLeftInclToday)} />
            <Row k="workouts still needed" v={String(diag.needed)} />
            <Row k="slack" v={String(diag.slack)} ok={diag.slack === null ? undefined : diag.slack > 0} />
            <Row k="worked today" v={String(diag.workedToday)} />
            <Row k="AT-RISK (eligible)" v={String(diag.atRiskEligible)} ok={!diag.atRiskEligible} />
            <Row k="founder_sim override active" v={String(diag.simActive)} ok={!diag.simActive} />
          </dl>
          <p className="mt-3 text-caption text-text-dim">
            Read-only snapshot. Per the rule, at-risk should be true only when
            slack === 0. Nothing has been changed.
          </p>
        </section>

        {/* §1 — gate confirmation */}
        <section className="rounded-card border border-border bg-surface p-5">
          <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
            Access
          </p>
          <dl className="mt-3 space-y-1.5 text-label">
            <Row k="Gate" v="server-enforced (is_founder)" ok />
            <Row k="is_founder" v={isFounder ? "true" : "false"} ok={isFounder} />
            <Row k="Your user id" v={userId} mono />
          </dl>
        </section>

        {/* §2 — environment / build (presence-only, never secret values) */}
        {env && (
          <section className="rounded-card border border-border bg-surface p-5">
            <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
              Environment
            </p>
            <dl className="mt-3 space-y-1.5 text-label">
              <Row k="Commit" v={env.commit} mono />
              <Row k="Branch" v={env.branch ?? "—"} mono />
              <Row k="Env" v={env.environment} />
              <Row k="Supabase ref" v={env.supabaseRef ?? "—"} mono />
              <Row k="VAPID public" v={env.vapidPublic ? "configured" : "missing"} ok={env.vapidPublic} />
              <Row k="VAPID private" v={env.vapidPrivate ? "configured" : "missing"} ok={env.vapidPrivate} />
              <Row k="Service role" v={env.serviceRole ? "configured" : "missing"} ok={env.serviceRole} />
              <Row k="Cron secret" v={env.cronSecret ? "configured" : "missing"} ok={env.cronSecret} />
              <Row
                k="Cron last run"
                v={
                  env.cronLastRun
                    ? `${new Date(env.cronLastRun.at).toLocaleString()} · ${env.cronLastRun.fired} fired / ${env.cronLastRun.candidates}`
                    : "never"
                }
                ok={!!env.cronLastRun}
              />
            </dl>
            <p className="mt-3 text-caption text-text-dim">
              Presence only — secret values are never shown.
            </p>
          </section>
        )}

        {/* §3 — notifications test (founder's own device only) */}
        <NotificationsSection subCount={subCount} />

        {/* §4 — onboarding/tour preview + replay + guarded reset */}
        <OnboardingSection />

        {/* §5 — streak/tier simulator (snapshot-protected, own account only) */}
        <SimulatorSection
          engine={engine}
          tierConfirmed={tierConfirmed}
          tierProvisional={tierProvisional}
          simActive={simActive}
          snapshotTakenAt={snapshotTakenAt}
        />

        {/* §6 — seed/wipe demo data (founder-scoped, tagged) */}
        <DemoSection />
      </div>
    </main>
  );
}

function Row({
  k,
  v,
  ok,
  mono,
}: {
  k: string;
  v: string;
  ok?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-muted">{k}</dt>
      <dd
        className={[
          mono ? "font-mono text-caption" : "text-label",
          ok === undefined ? "text-text" : ok ? "text-volt" : "text-danger",
          "truncate text-right",
        ].join(" ")}
      >
        {v}
      </dd>
    </div>
  );
}
