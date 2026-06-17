"use client";

import Link from "next/link";
import type { FounderEnv } from "@/lib/founder-env";
import { NotificationsSection } from "@/components/founder/NotificationsSection";

/**
 * Founder/QA harness panel (STACK_FOUNDER_MODE). Internal tool — styled with a
 * loud "FOUNDER / QA" band so it's never mistaken for a user feature. Sections
 * are added incrementally per the spec's build order; each is independently
 * founder-gated on the server.
 */
export function FounderPanel({
  userId,
  isFounder,
  env,
  subCount,
}: {
  userId: string;
  isFounder: boolean;
  env: FounderEnv | null;
  subCount: number;
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

      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-h2">Founder tools</h1>
        <Link href="/home" className="text-label text-text-muted hover:text-text">
          ← Home
        </Link>
      </header>

      <div className="flex flex-col gap-4">
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
