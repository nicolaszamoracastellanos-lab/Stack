"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useLanguage } from "@/lib/language-context";
import { SPORTS, iconFor, labelFor } from "@/lib/workout-options";

type ActivityItem = {
  id: string;
  photoUrl: string;
  note: string | null;
  sport: string | null;
  createdAt: string;
};

type Window = "today" | "week" | "month";

export function ActivityView({ items }: { items: ActivityItem[] }) {
  const { t, lang } = useLanguage();
  const [window, setWindow] = useState<Window>("week");

  const filtered = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const cutoff =
      window === "today"
        ? startToday.getTime()
        : now.getTime() - (window === "week" ? 7 : 30) * 86_400_000;
    return items.filter((it) => new Date(it.createdAt).getTime() >= cutoff);
  }, [items, window]);

  const options = [
    { value: "today" as const, label: t("activity_today") },
    { value: "week" as const, label: t("activity_week") },
    { value: "month" as const, label: t("activity_month") },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <h1 className="text-h1">{t("activity_title")}</h1>

      <div className="mt-6">
        <SegmentedControl options={options} value={window} onChange={setWindow} />
      </div>

      <p className="mt-4 text-label text-text-muted">
        {t("activity_count", { n: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-card border border-dashed border-border px-4 py-14 text-center">
          <p className="text-body text-text-dim">
            {items.length === 0
              ? t("activity_empty")
              : t("activity_empty_window")}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-card bg-surface-2 ring-1 ring-border"
              title={[
                item.sport ? labelFor(SPORTS, item.sport, lang) : null,
                item.note,
                new Date(item.createdAt).toLocaleDateString(lang),
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage urls */}
              <img
                src={item.photoUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-200 group-active:scale-[1.03]"
              />
              {item.sport && (
                <span className="absolute left-1 top-1 rounded bg-bg/70 px-1.5 py-0.5 text-[11px] leading-none backdrop-blur-sm">
                  {iconFor(SPORTS, item.sport)}
                </span>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-bg/70 px-1.5 py-0.5 font-mono text-[10px] leading-none text-text backdrop-blur-sm">
                {new Date(item.createdAt).toLocaleDateString(lang, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
