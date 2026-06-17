"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { seedDemo, wipeDemo } from "@/app/(app)/founder/demo-actions";

/**
 * §6 — seed/wipe demo data. Founder-scoped + is_demo-tagged; wipe deletes only
 * the demo group(s) (cascade removes their members/check-ins/reactions). Real
 * data is never touched.
 */
export function DemoSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string; count?: number }>) {
    setBusy(true);
    setMsg(null);
    const res = await fn();
    setBusy(false);
    setMsg(res.ok ? `✓ ${label} (${res.count ?? 0})` : `✕ ${label}: ${res.error}`);
    if (res.ok) router.refresh();
  }

  function confirmWipe() {
    if (window.confirm("Delete ALL your demo data? Real groups/check-ins are untouched.")) {
      run("wiped demo", wipeDemo);
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
        Seed & wipe demo data
      </p>
      <p className="mt-2 text-caption text-text-dim">
        Creates a founder-owned “🧪 Demo Group” + sample check-ins, all tagged
        is_demo. Wipe removes only the demo group (cascade). Real data untouched.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run("seeded demo", seedDemo)}
          className="rounded-pill border border-border bg-bg px-3 py-1.5 text-caption font-medium text-text hover:border-volt disabled:opacity-50"
        >
          Seed demo group
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirmWipe}
          className="rounded-pill border border-danger/50 bg-danger/10 px-3 py-1.5 text-caption font-medium text-danger disabled:opacity-50"
        >
          Wipe demo data
        </button>
      </div>
      {msg && <p className="mt-3 font-mono text-caption text-text-muted">{msg}</p>}
    </section>
  );
}
