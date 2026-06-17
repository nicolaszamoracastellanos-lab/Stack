"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  replayWelcome,
  replayTour,
  resetOnboarding,
} from "@/app/(app)/founder/sim-actions";

/**
 * §4 — onboarding/tour. Replay = non-destructive flag flips (the real splash/
 * welcome/tour show again on next Home load without losing any data). Full reset
 * is secondary + guarded: snapshot first, explicit confirm, never deletes
 * check-ins/streak/groups/tier history.
 */
export function OnboardingSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setMsg(null);
    const res = await fn();
    setBusy(false);
    setMsg(res.ok ? `✓ ${label} — open Home to see it` : `✕ ${label}: ${res.error}`);
    if (res.ok) router.refresh();
  }

  async function confirmReset() {
    const ok = window.confirm(
      "Reset onboarding?\n\nThis re-runs the REQUIRED onboarding (username/photo/sport) " +
        "and replays the welcome story + tour on next load.\n\nIt does NOT delete your " +
        "check-ins, streak, groups, or tier history. A snapshot is taken first — use " +
        "“Restore snapshot” in the simulator to undo.",
    );
    if (ok) run("onboarding reset", resetOnboarding);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
        Onboarding, tour & instructions
      </p>

      {/* Non-destructive preview links */}
      <p className="mt-3 text-caption text-text-dim">Preview (read-only)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href="/tiers" className={pill}>Tier Guide →</Link>
        <Link href="/welcome" className={pill}>Welcome story →</Link>
        <Link href="/install" className={pill}>Install guide →</Link>
      </div>

      {/* Replay (non-destructive flag flips) */}
      <p className="mt-4 text-caption text-text-dim">Replay live (no data loss)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run("welcome replay", replayWelcome)} className={pill}>
          Replay welcome story
        </button>
        <button type="button" disabled={busy} onClick={() => run("tour replay", replayTour)} className={pill}>
          Replay feature tour
        </button>
      </div>

      {/* Guarded full reset */}
      <p className="mt-4 text-caption text-text-dim">Full reset (secondary, guarded)</p>
      <button
        type="button"
        disabled={busy}
        onClick={confirmReset}
        className="mt-2 rounded-pill border border-danger/50 bg-danger/10 px-3 py-1.5 text-caption font-medium text-danger disabled:opacity-50"
      >
        Reset my onboarding state…
      </button>

      {msg && <p className="mt-3 font-mono text-caption text-text-muted">{msg}</p>}
    </section>
  );
}

const pill =
  "rounded-pill border border-border bg-bg px-3 py-1.5 text-caption font-medium text-text hover:border-volt disabled:opacity-50";
