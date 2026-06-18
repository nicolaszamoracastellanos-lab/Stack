"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Toggle } from "@/components/Toggle";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { subscribePush, unsubscribePush } from "@/lib/push/client";
import { detectPushCapability, type PushCapability } from "@/lib/push/capability";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/push/types";
import type { TranslationKey } from "@/lib/i18n";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const TYPE_LABEL: Partial<Record<NotificationType, TranslationKey>> = {
  group_post: "notif_type_group_post",
  group_join: "notif_type_group_join",
  member_workout: "notif_type_member_workout",
  self_nudge: "notif_type_self_nudge",
  at_risk: "notif_type_at_risk",
  member_nudge: "notif_type_member_nudge",
  tier_projection: "notif_type_tier_projection",
};

export function NotificationSettings({
  userId,
  master,
  types,
  quietStart,
  quietEnd,
}: {
  userId: string;
  master: boolean;
  types: Record<string, boolean>;
  quietStart: number;
  quietEnd: number;
}) {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [cap, setCap] = useState<PushCapability | null>(null);
  const [on, setOn] = useState(master);
  const [typeState, setTypeState] = useState<Record<string, boolean>>(types ?? {});
  const [qStart, setQStart] = useState(quietStart);
  const [qEnd, setQEnd] = useState(quietEnd);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCap(detectPushCapability());
  }, []);

  async function toggleMaster(next: boolean) {
    if (busy) return;
    setBusy(true);
    if (next) {
      const ok = await subscribePush(VAPID_PUBLIC_KEY);
      if (!ok) {
        setCap(detectPushCapability()); // reflect a denied permission
        setBusy(false);
        return;
      }
      setOn(true);
      await supabase
        .from("profiles")
        .update({ notif_master: true, language: lang })
        .eq("id", userId);
    } else {
      await unsubscribePush();
      setOn(false);
      await supabase.from("profiles").update({ notif_master: false }).eq("id", userId);
    }
    setBusy(false);
  }

  async function toggleType(type: NotificationType, next: boolean) {
    const updated = { ...typeState, [type]: next };
    setTypeState(updated);
    await supabase.from("profiles").update({ notif_types: updated }).eq("id", userId);
  }

  async function saveQuiet(start: number, end: number) {
    setQStart(start);
    setQEnd(end);
    await supabase
      .from("profiles")
      .update({ quiet_start: start, quiet_end: end })
      .eq("id", userId);
  }

  // iOS Safari, not installed → route to install instead of a broken toggle.
  if (cap?.iosNeedsInstall) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("notif_title")}
        </p>
        <p className="mt-3 text-body text-text-muted">{t("notif_ios_install")}</p>
        <Link
          href="/install"
          className="mt-3 inline-block text-label text-volt underline-offset-4 hover:underline"
        >
          {t("notif_ios_install_cta")} →
        </Link>
      </div>
    );
  }

  const unsupported = cap !== null && !cap.supported;
  const blocked = cap?.permission === "denied";

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
        {t("notif_title")}
      </p>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-body text-text">{t("notif_master_label")}</p>
          <p className="mt-0.5 text-caption text-text-muted">
            {unsupported
              ? t("notif_unsupported")
              : blocked
                ? t("notif_blocked")
                : t("notif_master_hint")}
          </p>
        </div>
        <Toggle
          checked={on}
          onChange={toggleMaster}
          disabled={busy || unsupported || blocked}
          label={t("notif_master_label")}
        />
      </div>

      {on && !unsupported && !blocked && (
        <>
          <p className="mt-6 text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("notif_types_label")}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {NOTIFICATION_TYPES.map((type) => (
              <li key={type} className="flex items-center justify-between gap-4">
                <span className="text-label text-text">{t(TYPE_LABEL[type]!)}</span>
                <Toggle
                  checked={typeState[type] !== false}
                  onChange={(next) => toggleType(type, next)}
                  label={t(TYPE_LABEL[type]!)}
                />
              </li>
            ))}
          </ul>

          <p className="mt-6 text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("notif_quiet_label")}
          </p>
          <p className="mt-1 text-caption text-text-muted">{t("notif_quiet_hint")}</p>
          <div className="mt-3 flex items-center gap-4">
            <label className="flex items-center gap-2 text-label text-text-muted">
              {t("notif_quiet_from")}
              <HourSelect value={qStart} onChange={(h) => saveQuiet(h, qEnd)} />
            </label>
            <label className="flex items-center gap-2 text-label text-text-muted">
              {t("notif_quiet_to")}
              <HourSelect value={qEnd} onChange={(h) => saveQuiet(qStart, h)} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function HourSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (h: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-input border border-border bg-bg px-2.5 py-1.5 text-label text-text focus:border-volt focus:outline-none"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, "0")}:00
        </option>
      ))}
    </select>
  );
}
