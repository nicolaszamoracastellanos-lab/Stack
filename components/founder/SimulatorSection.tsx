"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, type TierKey } from "@/lib/tiers";
import { TierBadge } from "@/components/TierBadge";
import {
  snapshotState,
  restoreState,
  setGoalSim,
  setTierSim,
  setStreakOverride,
  clearStreakOverride,
  runQ5Check,
} from "@/app/(app)/founder/sim-actions";

export type FounderEngine = {
  weeklyGoal: number | null;
  quotaActiveFrom: string | null;
  count: number;
  state: string;
  weekWorkouts: number;
  needed: number;
  daysLeftInclToday: number;
  slack: number;
  reachable: boolean;
};

export function SimulatorSection({
  engine,
  tierConfirmed,
  tierProvisional,
  simActive,
  snapshotTakenAt,
}: {
  engine: FounderEngine;
  tierConfirmed: TierKey | null;
  tierProvisional: TierKey | null;
  simActive: boolean;
  snapshotTakenAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [jumpN, setJumpN] = useState(10);
  const [q5, setQ5] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setMsg(null);
    const res = await fn();
    setBusy(false);
    setMsg(res.ok ? `✓ ${label}` : `✕ ${label}: ${res.error}`);
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
        Streak & tier simulator
      </p>

      {/* Snapshot / restore */}
      <div className="mt-3 rounded-input border border-volt/30 bg-volt/5 p-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run("snapshot", snapshotState)} className={btn}>
            Snapshot my real state
          </button>
          <button type="button" disabled={busy} onClick={() => run("restore", restoreState)} className={btn}>
            Restore snapshot
          </button>
        </div>
        <p className="mt-2 text-caption text-text-dim">
          {snapshotTakenAt
            ? `Snapshot: ${new Date(snapshotTakenAt).toLocaleString()} · auto-taken before first change.`
            : "No snapshot yet — one is taken automatically before any change below."}
        </p>
      </div>

      {/* Live engine readout (REAL, ignores the display override) */}
      <div className="mt-4 rounded-input border border-border bg-bg p-3">
        <p className="text-caption text-text-dim">Live engine (real check-ins)</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-caption">
          <Stat k="Q (goal)" v={engine.weeklyGoal ?? "—"} />
          <Stat k="state" v={engine.state} />
          <Stat k="count" v={engine.count} />
          <Stat k="week workouts" v={engine.weekWorkouts} />
          <Stat k="needed" v={engine.needed} />
          <Stat k="days left" v={engine.daysLeftInclToday} />
          <Stat k="slack" v={engine.slack} />
          <Stat k="reachable" v={engine.reachable ? "yes" : "no"} />
        </dl>
        <p className="mt-1 text-caption text-text-dim">
          quota active from: {engine.quotaActiveFrom ?? "—"}
        </p>
      </div>

      {/* Set Q */}
      <Label>Weekly goal Q</Label>
      <div className="grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => run(`Q=${n}`, () => setGoalSim(n))}
            className={`h-9 rounded-input border text-label font-bold ${
              engine.weeklyGoal === n ? "border-volt bg-volt/15 text-volt" : "border-border bg-bg text-text-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Streak display override */}
      <Label>Streak display override {simActive && <span className="text-volt">· ACTIVE</span>}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          value={jumpN}
          onChange={(e) => setJumpN(Number(e.target.value))}
          className="w-16 rounded-input border border-border bg-bg px-2 py-1.5 text-label text-text focus:border-volt focus:outline-none"
        />
        <button type="button" disabled={busy} onClick={() => run(`jump ${jumpN}`, () => setStreakOverride(jumpN, "alive"))} className={btn}>
          Jump to N
        </button>
        <button type="button" disabled={busy} onClick={() => run("at-risk", () => setStreakOverride(jumpN || 10, "at-risk"))} className={btnDanger}>
          Force at-risk
        </button>
        <button type="button" disabled={busy} onClick={() => run("break", () => setStreakOverride(0, "broken"))} className={btnDanger}>
          Force break
        </button>
        <button type="button" disabled={busy} onClick={() => run("clear override", clearStreakOverride)} className={btn}>
          Clear override
        </button>
      </div>

      {/* Tiers */}
      <Label>Confirmed tier</Label>
      <TierRow current={tierConfirmed} busy={busy} onPick={(k) => run(`confirmed ${k ?? "none"}`, () => setTierSim(k, tierProvisional))} />
      <Label>Provisional tier</Label>
      <TierRow current={tierProvisional} busy={busy} onPick={(k) => run(`provisional ${k ?? "none"}`, () => setTierSim(tierConfirmed, k))} />

      {/* Q=5 regression check */}
      <Label>Core mechanic</Label>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await runQ5Check();
          setBusy(false);
          setQ5(
            !r.ok
              ? `✕ ${r.error}`
              : r.pass
                ? `✓ PASS — Wed ${r.wed?.state} (slack ${r.wed?.slack}), Thu ${r.thu?.state}`
                : `✕ FAIL — Wed ${r.wed?.state}/${r.wed?.slack}, Thu ${r.thu?.state}`,
          );
        }}
        className={btn}
      >
        Run Q=5 worked-example check
      </button>
      {q5 && <p className="mt-2 font-mono text-caption text-text-muted">{q5}</p>}

      {msg && <p className="mt-3 font-mono text-caption text-text-muted">{msg}</p>}
    </section>
  );
}

const btn =
  "rounded-pill border border-border bg-bg px-3 py-1.5 text-caption font-medium text-text hover:border-volt disabled:opacity-50";
const btnDanger =
  "rounded-pill border border-danger/50 bg-danger/10 px-3 py-1.5 text-caption font-medium text-danger disabled:opacity-50";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-5 text-caption font-medium uppercase tracking-wide text-text-dim">{children}</p>;
}
function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-text-dim">{k}</span>
      <span className="text-text">{v}</span>
    </div>
  );
}
function TierRow({
  current,
  busy,
  onPick,
}: {
  current: TierKey | null;
  busy: boolean;
  onPick: (k: TierKey | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TIERS.map((t) => (
        <button
          key={t.key}
          type="button"
          disabled={busy}
          onClick={() => onPick(t.key)}
          className={`rounded-pill border px-1 py-0.5 disabled:opacity-50 ${
            current === t.key ? "border-volt" : "border-transparent"
          }`}
        >
          <TierBadge tierKey={t.key} size="sm" />
        </button>
      ))}
      <button
        type="button"
        disabled={busy}
        onClick={() => onPick(null)}
        className={`rounded-pill border px-2.5 py-1 text-caption disabled:opacity-50 ${
          current === null ? "border-volt text-volt" : "border-border text-text-dim"
        }`}
      >
        none
      </button>
    </div>
  );
}
