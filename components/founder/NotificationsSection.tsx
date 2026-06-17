"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { detectPushCapability, type PushCapability } from "@/lib/push/capability";
import { fireTestNotification, fireRawNotification } from "@/app/(app)/founder/actions";
import type { NotificationType } from "@/lib/push/types";

const TRIGGERS: { type: NotificationType; label: string; projection?: "up" | "down" | "confirmed" }[] = [
  { type: "group_post", label: "1 · Someone posted" },
  { type: "group_join", label: "2 · Someone joined" },
  { type: "member_workout", label: "3 · Member workout" },
  { type: "self_nudge", label: "4 · Late self-nudge" },
  { type: "at_risk", label: "5 · At-risk" },
  { type: "member_nudge", label: "6 · Member nudge" },
  { type: "tier_projection", label: "7a · Projection ↑", projection: "up" },
  { type: "tier_projection", label: "7b · Projection ↓", projection: "down" },
  { type: "tier_projection", label: "7c · Tier earned", projection: "confirmed" },
];

function platform(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function NotificationsSection({ subCount }: { subCount: number }) {
  const { lang } = useLanguage();
  const [cap, setCap] = useState<PushCapability | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rawTitle, setRawTitle] = useState("Stack test");
  const [rawBody, setRawBody] = useState("Raw push from the founder panel.");

  useEffect(() => setCap(detectPushCapability()), []);

  async function fire(type: NotificationType, projection?: "up" | "down" | "confirmed") {
    setBusy(true);
    setStatus(null);
    const res = await fireTestNotification({ type, lang, projection });
    setBusy(false);
    setStatus(
      res.error
        ? `✕ ${res.error}`
        : res.sent > 0
          ? `✓ sent to ${res.sent} device(s) [${lang}]`
          : "✓ accepted but 0 devices — subscribe first",
    );
  }

  async function fireRaw() {
    setBusy(true);
    setStatus(null);
    const res = await fireRawNotification({ title: rawTitle, body: rawBody });
    setBusy(false);
    setStatus(res.error ? `✕ ${res.error}` : `✓ raw sent to ${res.sent} device(s)`);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
        Notifications · test to your own device
      </p>

      {/* Status readout */}
      <dl className="mt-3 space-y-1.5 text-label">
        <StatusRow k="Permission" v={cap?.permission ?? "…"} ok={cap?.permission === "granted"} />
        <StatusRow k="Subscription" v={subCount > 0 ? `${subCount} on file` : "none"} ok={subCount > 0} />
        <StatusRow k="Platform" v={platform()} />
        <StatusRow k="Installed PWA" v={isStandalone() ? "yes" : "no"} />
        {cap?.iosNeedsInstall && (
          <StatusRow k="iOS" v="not installed — push impossible until added to Home Screen" ok={false} />
        )}
      </dl>

      {/* Trigger buttons (all 7 types; localized to current language) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {TRIGGERS.map((t) => (
          <button
            key={t.label}
            type="button"
            disabled={busy}
            onClick={() => fire(t.type, t.projection)}
            className="rounded-input border border-border bg-bg px-3 py-2 text-left text-caption text-text hover:border-volt disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Raw push */}
      <div className="mt-4 rounded-input border border-border bg-bg p-3">
        <p className="text-caption text-text-dim">Raw test push</p>
        <input
          value={rawTitle}
          onChange={(e) => setRawTitle(e.target.value)}
          placeholder="Title"
          className="mt-2 w-full rounded-input border border-border bg-surface px-2.5 py-1.5 text-label text-text focus:border-volt focus:outline-none"
        />
        <input
          value={rawBody}
          onChange={(e) => setRawBody(e.target.value)}
          placeholder="Body"
          className="mt-2 w-full rounded-input border border-border bg-surface px-2.5 py-1.5 text-label text-text focus:border-volt focus:outline-none"
        />
        <button
          type="button"
          disabled={busy}
          onClick={fireRaw}
          className="mt-2 rounded-pill border border-volt bg-volt/15 px-3 py-1.5 text-caption font-medium text-volt disabled:opacity-50"
        >
          Send raw
        </button>
      </div>

      {status && (
        <p className="mt-3 font-mono text-caption text-text-muted">{status}</p>
      )}
    </section>
  );
}

function StatusRow({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-muted">{k}</dt>
      <dd
        className={[
          "truncate text-right text-label",
          ok === undefined ? "text-text" : ok ? "text-volt" : "text-danger",
        ].join(" ")}
      >
        {v}
      </dd>
    </div>
  );
}
