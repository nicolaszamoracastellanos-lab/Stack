"use client";

import { useLanguage } from "@/lib/language-context";
import type { GroupDetailData } from "@/lib/group-detail";

/**
 * Weekly group recap (Batch 2 · Section 7). A screenshot-worthy dark + volt card
 * summarizing the group's week, computed on demand from the group-detail data
 * already loaded (no extra query). Surfaced at the top of the group page.
 *
 * "Committed days" isn't modeled yet, so the positive callout is a "perfect
 * week" (7/7) highlight. // PHASE 3: per-user weekly commitments + a persisted
 * Sunday-generated recap with its own shareable image export.
 */
function RecapStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card bg-bg/40 p-4">
      <p className="font-mono text-h1 nums leading-none text-volt">{value}</p>
      <p className="mt-1.5 text-caption text-text-muted">{label}</p>
    </div>
  );
}

export function RecapCard({ data }: { data: GroupDetailData }) {
  const { t } = useLanguage();
  const week = data.windows.week;

  const perfect = data.members.filter((m) => m.showStats && m.daysThisWeek >= 7);

  return (
    <section className="overflow-hidden rounded-card border border-volt/30 bg-gradient-to-br from-volt/10 to-surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-h2 text-text">{t("recap_title")}</h2>
        <span className="text-caption text-text-muted">{t("recap_subtitle")}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <RecapStat value={`${data.consistencyPct}%`} label={t("gd_consistency")} />
        <RecapStat value={String(week.total)} label={t("recap_checkins")} />
        <RecapStat
          value={`🔥 ${data.collectiveStreak}`}
          label={t("gd_collective_streak")}
        />
        <RecapStat
          value={week.mostConsistent ? `${week.mostConsistent.days}/7` : "—"}
          label={t("gd_most_consistent")}
        />
      </div>

      {week.mostConsistent && (
        <p className="mt-4 text-label text-text-muted">
          🏅 {t("gd_most_consistent")}:{" "}
          <span className="font-medium text-text">{week.mostConsistent.name}</span>
        </p>
      )}

      {perfect.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-label text-text-muted">⭐️ {t("recap_perfect")}:</span>
          {perfect.map((m) => (
            <span
              key={m.userId}
              className="rounded-pill border border-volt/30 bg-volt/10 px-2.5 py-1 text-caption font-medium text-volt"
            >
              {m.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
