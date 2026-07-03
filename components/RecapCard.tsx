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
function RecapStat({
  value,
  label,
  hero = false,
}: {
  value: string;
  label: string;
  /** The week's ONE volt headline number. Everything else stays quiet. */
  hero?: boolean;
}) {
  return (
    <div className="rounded-card bg-bg/40 p-4">
      <p
        className={
          hero
            ? "font-mono text-stat nums leading-none text-volt"
            : "font-mono text-stat nums leading-none text-text"
        }
      >
        {value}
      </p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

export function RecapCard({ data }: { data: GroupDetailData }) {
  const { t } = useLanguage();
  const week = data.windows.week;

  // Perfect week = the member hit THEIR weekly goal, not a flat 7/7.
  const perfect = data.members.filter(
    (m) =>
      m.showStats &&
      m.daysThisWeek >= Math.min(7, Math.max(1, m.weeklyGoal ?? 7)),
  );

  // A recap has to be earned — a brand-new or quiet week gets a nudge, not a
  // wall of zeros.
  if (week.total === 0) {
    return (
      <section className="rounded-card border border-volt/30 bg-volt/10 p-4">
        <p className="text-label text-text">{t("recap_empty")}</p>
      </section>
    );
  }

  return (
    // Editorial: deep dark full-bleed layout, oversized numerals, the
    // consistency percentage as the week's single volt headline.
    <section className="depth-raised relative overflow-hidden rounded-card border border-border p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-pill bg-volt/[0.07] blur-[60px]"
      />
      <div className="relative flex items-baseline justify-between">
        <h2 className="eyebrow">{t("recap_title")}</h2>
        <span className="text-caption text-text-dim">{t("recap_subtitle")}</span>
      </div>

      <p className="relative mt-4 font-mono text-display-xl nums leading-none text-volt">
        {data.consistencyPct}
        <span className="text-h1 text-text-muted">%</span>
      </p>
      <p className="eyebrow mt-2">{t("gd_consistency")}</p>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        <RecapStat value={String(week.total)} label={t("recap_checkins")} />
        <RecapStat
          value={`🔥${data.collectiveStreak}`}
          label={t("gd_collective_streak")}
        />
        <RecapStat
          value={week.mostConsistent ? `${week.mostConsistent.days}/7` : "0/7"}
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
