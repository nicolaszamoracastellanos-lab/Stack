"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { StreakBadge } from "@/components/StreakBadge";
import { TierBadge } from "@/components/TierBadge";
import { AtRiskAlert } from "@/components/AtRiskAlert";
import { GoalSetup } from "@/components/GoalSetup";
import { RestPrompt } from "@/components/RestPrompt";
import { PushPrompt } from "@/components/PushPrompt";
import { useLanguage } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import { localDateKey, toDaySet } from "@/lib/streaks";
import { computeQuotaStreak } from "@/lib/streak-quota";
import type { StreakContext } from "@/lib/streak-context";
import { weekDayKeys } from "@/lib/week";

/**
 * Personal snapshot (STACK_BATCH6 2.1): consistency ring, quota streak, tier
 * badge, at-risk alert, rest prompt, goal setup, check-in CTA. Shared by the
 * combined Home and the solo Home so a solo user sees the same top region.
 */
export function Snapshot({
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
    return ctx.streakOverride
      ? { ...computed, count: ctx.streakOverride.count, state: ctx.streakOverride.state }
      : computed;
  }, [personalDates, restDays, ctx.weeklyGoal, ctx.quotaActiveFromKey, ctx.tz, ctx.streakOverride]);
  const displayedStreak = useCountUp(streak.count);

  const goalDenom = ctx.weeklyGoal && ctx.weeklyGoal > 0 ? ctx.weeklyGoal : 7;
  const consistency = useMemo(() => {
    const set = toDaySet(personalDates);
    const days = weekDayKeys(localDateKey(new Date())).filter((k) => set.has(k)).length;
    const value = Math.min(1, days / goalDenom);
    return { days, value, percent: Math.round(value * 100) };
  }, [personalDates, goalDenom]);

  const checkedInToday = useMemo(
    () => toDaySet(personalDates).has(localDateKey(new Date())),
    [personalDates],
  );

  const tierKey = (ctx.confirmedTier ?? ctx.provisionalTier) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {ctx.needsGoal && <GoalSetup userId={userId} suggested={suggestedGoal} />}

      {streak.state === "at-risk" && <AtRiskAlert />}

      <RestPrompt
        userId={userId}
        preferredRestDays={ctx.preferredRestDays}
        loggedDayKeys={personalDates}
      />

      <section className="flex flex-col items-center">
        <ConsistencyRing
          value={consistency.value}
          percent={consistency.percent}
          label={t("home_consistency")}
          sublabel={`${consistency.days}/${goalDenom}`}
        />
        <div className="mt-6 w-full rounded-card border border-border bg-surface p-5">
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
      </section>

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
    </div>
  );
}
