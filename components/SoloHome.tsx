"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { StreakBadge } from "@/components/StreakBadge";
import { TierBadge } from "@/components/TierBadge";
import { AtRiskAlert } from "@/components/AtRiskAlert";
import { GoalSetup } from "@/components/GoalSetup";
import { RestPrompt } from "@/components/RestPrompt";
import { PushPrompt } from "@/components/PushPrompt";
import { Heatmap } from "@/components/Heatmap";
import { JoinByCode } from "@/components/JoinByCode";
import { useLanguage } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import { localDateKey, toDaySet } from "@/lib/streaks";
import { computeQuotaStreak } from "@/lib/streak-quota";
import type { StreakContext } from "@/lib/streak-context";
import { weekDayKeys } from "@/lib/week";

const PROMPT_SESSION_KEY = "stack_solo_prompt_seen";

/**
 * Home for a user with zero groups (Batch 5 B1/B3 + C). Full personal value —
 * quota streak, consistency ring, heatmap, tier — plus two large primary
 * actions into a group and a gentle once-per-session nudge.
 */
export function SoloHome({
  userId,
  personalDates,
  restDays,
  ctx,
  suggestedGoal,
}: {
  userId: string;
  personalDates: string[];
  restDays: string[];
  ctx: StreakContext;
  suggestedGoal: number;
}) {
  const { t } = useLanguage();

  const streak = useMemo(() => {
    const computed = computeQuotaStreak(personalDates, {
      weeklyGoal: ctx.weeklyGoal,
      quotaActiveFromKey: ctx.quotaActiveFromKey,
      restDayKeys: restDays,
      tz: ctx.tz,
      now: new Date(),
    });
    // Founder simulator override (founder-only); never set for normal users.
    return ctx.streakOverride
      ? { ...computed, count: ctx.streakOverride.count, state: ctx.streakOverride.state }
      : computed;
  }, [personalDates, restDays, ctx.weeklyGoal, ctx.quotaActiveFromKey, ctx.tz, ctx.streakOverride]);
  const displayedStreak = useCountUp(streak.count);

  const goalDenom = ctx.weeklyGoal && ctx.weeklyGoal > 0 ? ctx.weeklyGoal : 7;
  const consistency = useMemo(() => {
    const set = toDaySet(personalDates);
    const days = weekDayKeys(localDateKey(new Date())).filter((k) =>
      set.has(k),
    ).length;
    const value = Math.min(1, days / goalDenom);
    return { days, value, percent: Math.round(value * 100) };
  }, [personalDates, goalDenom]);

  const checkedInToday = useMemo(
    () => toDaySet(personalDates).has(localDateKey(new Date())),
    [personalDates],
  );

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of personalDates) {
      const k = localDateKey(new Date(d));
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [personalDates]);
  const restSet = useMemo(() => new Set(restDays), [restDays]);

  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(PROMPT_SESSION_KEY)) {
        setShowPrompt(true);
        sessionStorage.setItem(PROMPT_SESSION_KEY, "1");
      }
    } catch {
      /* sessionStorage unavailable — skip the prompt */
    }
  }, []);

  const tierKey = (ctx.confirmedTier ?? ctx.provisionalTier) ?? null;

  return (
    <div className="flex flex-col gap-8">
      {ctx.needsGoal && <GoalSetup userId={userId} suggested={suggestedGoal} />}

      {streak.state === "at-risk" && <AtRiskAlert />}

      <RestPrompt
        userId={userId}
        preferredRestDays={ctx.preferredRestDays}
        loggedDayKeys={personalDates}
      />

      {showPrompt && (
        <Link
          href="/groups/new"
          className="flex items-center gap-3 rounded-card border border-volt/30 bg-volt/10 px-4 py-3 transition-colors hover:bg-volt/15"
        >
          <span aria-hidden className="text-xl">🤝</span>
          <p className="text-label font-medium text-volt">{t("solo_prompt")}</p>
        </Link>
      )}

      {/* Hero: weekly consistency ring */}
      <section className="flex flex-col items-center">
        <ConsistencyRing
          value={consistency.value}
          percent={consistency.percent}
          label={t("home_consistency")}
          sublabel={`${consistency.days}/${goalDenom}`}
        />
        <div className="mt-6 w-full">
          <div className="rounded-card border border-border bg-surface p-5">
            <StreakBadge
              count={displayedStreak}
              label={t("streak_label")}
              state={streak.state}
              size="md"
            />
            <Link href="/tiers" className="mt-3 inline-block">
              <TierBadge tierKey={tierKey} provisional={!ctx.confirmedTier} size="sm" />
            </Link>
          </div>
        </div>
      </section>

      {/* Check-in CTA */}
      {checkedInToday ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-card border border-volt/30 bg-volt/10 px-4 py-4">
            <span aria-hidden className="text-xl">✓</span>
            <p className="text-body font-medium text-volt">{t("checkin_done")}</p>
          </div>
          <PushPrompt userId={userId} />
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
