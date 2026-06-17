"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { StreakBadge } from "@/components/StreakBadge";
import { Heatmap } from "@/components/Heatmap";
import { JoinByCode } from "@/components/JoinByCode";
import { useLanguage } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import { computePersonalStreak, localDateKey, toDaySet } from "@/lib/streaks";
import { weekDayKeys } from "@/lib/week";

const PROMPT_SESSION_KEY = "stack_solo_prompt_seen";

/**
 * Home for a user with zero groups (Batch 5 B1/B3). They still get full personal
 * value — streak, consistency ring, heatmap ("The Stack") — all from their solo
 * check-ins, plus two large primary actions into a group and a gentle, once-per
 * -session nudge. The app never feels dead, and the path into a group is obvious
 * without being forced.
 */
export function SoloHome({
  personalDates,
  restDays,
}: {
  personalDates: string[];
  restDays: string[];
}) {
  const { t } = useLanguage();

  const streak = useMemo(
    () => computePersonalStreak(personalDates, new Date(), restDays),
    [personalDates, restDays],
  );
  const displayedStreak = useCountUp(streak.count);

  const consistency = useMemo(() => {
    const set = toDaySet(personalDates);
    const days = weekDayKeys(localDateKey(new Date())).filter((k) =>
      set.has(k),
    ).length;
    return { days, value: days / 7, percent: Math.round((days / 7) * 100) };
  }, [personalDates]);

  const checkedInToday = useMemo(
    () => toDaySet(personalDates).has(localDateKey(new Date())),
    [personalDates],
  );

  // Heatmap counts: posts per local day (solo dates are already deduped by post).
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of personalDates) {
      const k = localDateKey(new Date(d));
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [personalDates]);
  const restSet = useMemo(() => new Set(restDays), [restDays]);

  // Recurring-but-gentle prompt: shown at most once per browser session.
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(PROMPT_SESSION_KEY)) {
        setShowPrompt(true);
        sessionStorage.setItem(PROMPT_SESSION_KEY, "1");
      }
    } catch {
      /* sessionStorage unavailable (private mode) — just skip the prompt */
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {showPrompt && (
        <Link
          href="/groups/new"
          className="flex items-center gap-3 rounded-card border border-volt/30 bg-volt/10 px-4 py-3 transition-colors hover:bg-volt/15"
        >
          <span aria-hidden className="text-xl">🤝</span>
          <p className="text-label font-medium text-volt">
            {t("solo_prompt")}
          </p>
        </Link>
      )}

      {/* Hero: weekly consistency ring */}
      <section className="flex flex-col items-center">
        <ConsistencyRing
          value={consistency.value}
          percent={consistency.percent}
          label={t("home_consistency")}
          sublabel={`${consistency.days}/7`}
        />
        <div className="mt-6 w-full">
          <div className="rounded-card border border-border bg-surface p-5">
            <StreakBadge
              count={displayedStreak}
              label={t("streak_label")}
              state={streak.state}
              size="md"
            />
          </div>
        </div>
      </section>

      {/* Check-in CTA */}
      {checkedInToday ? (
        <div className="flex items-center gap-3 rounded-card border border-volt/30 bg-volt/10 px-4 py-4">
          <span aria-hidden className="text-xl">✓</span>
          <p className="text-body font-medium text-volt">{t("checkin_done")}</p>
        </div>
      ) : (
        <Link href="/checkin" className="w-full">
          <Button variant="primary" size="lg" fullWidth>
            {t("checkin_button")}
          </Button>
        </Link>
      )}

      {/* The Stack — personal heatmap */}
      <section>
        <h2 className="mb-3 text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("profile_heatmap_title")}
        </h2>
        <Heatmap counts={counts} restDays={restSet} />
      </section>

      {/* Group entry — push, don't force (B3). */}
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-h2">{t("solo_group_title")}</h2>
        <p className="mt-1 text-label text-text-muted">{t("solo_group_sub")}</p>
        <div className="mt-5 flex flex-col gap-4">
          <Link href="/groups/new">
            <Button variant="primary" size="lg" fullWidth>
              {t("home_create_group")}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-text-dim">{t("home_join_group")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <JoinByCode />
        </div>
      </section>
    </div>
  );
}
