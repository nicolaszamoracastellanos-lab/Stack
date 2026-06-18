"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { localDateKey } from "@/lib/streaks";
import {
  notifHref,
  notifActorName,
  notifTier,
  notifDescKey,
  type NotifRow,
} from "@/lib/notification-view";

/**
 * Notification center (STACK_BATCH6 1.4). Full-screen activity list, newest
 * first, sectioned Today / Earlier. Opening marks visible items read. Each row
 * deep-links to its target and marks itself read on tap.
 */
export function NotificationCenter({
  userId,
  initial,
}: {
  userId: string;
  initial: NotifRow[];
}) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<NotifRow[]>(initial);

  // Mark all currently-unread rows read on open.
  useEffect(() => {
    const unread = initial.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length === 0) return;
    const at = new Date().toISOString();
    createClient()
      .from("notifications")
      .update({ read_at: at })
      .eq("recipient_id", userId)
      .is("read_at", null)
      .then(() => {});
    setRows((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: at })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo(() => {
    const today = localDateKey(new Date());
    const todayRows: NotifRow[] = [];
    const earlier: NotifRow[] = [];
    for (const n of rows) {
      (localDateKey(new Date(n.created_at)) === today ? todayRows : earlier).push(n);
    }
    return { todayRows, earlier };
  }, [rows]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-4 flex items-center gap-3 px-2">
        <Link href="/home" className="text-label text-text-muted hover:text-text">
          {t("notifc_back")}
        </Link>
        <h1 className="text-h2">{t("notifc_title")}</h1>
      </header>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <span aria-hidden className="text-3xl">🔔</span>
          <p className="mt-3 text-h2">{t("notifc_empty_title")}</p>
          <p className="mt-2 text-body text-text-muted">{t("notifc_empty_body")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {sections.todayRows.length > 0 && (
            <Section title={t("notifc_today")} rows={sections.todayRows} t={t} />
          )}
          {sections.earlier.length > 0 && (
            <Section title={t("notifc_earlier")} rows={sections.earlier} t={t} />
          )}
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  rows,
  t,
}: {
  title: string;
  rows: NotifRow[];
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const now = Date.now();
  return (
    <section>
      <h2 className="mb-2 px-2 text-caption font-medium uppercase tracking-wide text-text-dim">
        {title}
      </h2>
      <ul className="flex flex-col">
        {rows.map((n) => (
          <li key={n.id}>
            <Link
              href={notifHref(n)}
              className="flex items-start gap-3 rounded-card px-2 py-3 hover:bg-surface"
            >
              <Avatar name={notifActorName(n)} src={n.actor?.avatar_url ?? null} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-body text-text">
                  {t(notifDescKey(n), {
                    name: notifActorName(n),
                    group: n.data?.group ?? "",
                    snippet: n.data?.snippet ?? "",
                    tier: n.data?.tier ?? "",
                  })}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-caption text-text-dim">
                    {formatRelativeTime(n.created_at, now, t("time_now"))}
                  </span>
                  {notifTier(n) && <TierBadge tierKey={notifTier(n)} size="sm" />}
                </div>
              </div>
              {!n.read_at && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-pill bg-volt" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
