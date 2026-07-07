"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { TierBadge } from "@/components/TierBadge";
import { AtRiskAlert } from "@/components/AtRiskAlert";
import { GoalSetup } from "@/components/GoalSetup";
import { RestPrompt } from "@/components/RestPrompt";
import { PushPrompt } from "@/components/PushPrompt";
import { useLanguage } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import { computeQuotaStreak, workoutDaySet } from "@/lib/streak-quota";
import type { StreakContext } from "@/lib/streak-context";
import { dayKey, weekDayKeys } from "@/lib/week";

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
  // Ring + "today" resolve in the same stored-timezone frame as the streak
  // beside them, so a traveller never sees the two disagree.
  const consistency = useMemo(() => {
    const set = workoutDaySet(personalDates, ctx.tz);
    const days = weekDayKeys(dayKey(new Date(), ctx.tz)).filter((k) =>
      set.has(k),
    ).length;
    const value = Math.min(1, days / goalDenom);
    return { days, value, percent: Math.round(value * 100) };
  }, [personalDates, goalDenom, ctx.tz]);

  const checkedInToday = useMemo(
    () => workoutDaySet(personalDates, ctx.tz).has(dayKey(new Date(), ctx.tz)),
    [personalDates, ctx.tz],
  );

  const tierKey = (ctx.confirmedTier ?? ctx.provisionalTier) ?? null;

  return (
    <div className="stagger flex flex-col gap-6">
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
        {/* Streak card, prototype §Home: 64px extruded numeral on the left,
            then a quiet column — DAY STREAK + the tier pill. */}
        <div className="depth mt-[18px] flex w-full items-center gap-[18px] rounded-card border border-border px-[22px] py-5">
          <span
            className={
              "type-numeral text-[64px] leading-[0.95] " +
              (streak.state === "broken" ? "text-danger" : "streak-extrude")
            }
            style={{ fontStretch: "120%" }}
          >
            {displayedStreak}
          </span>
          <div className="flex min-w-0 flex-col items-start gap-2">
            <span className="text-[15px] font-extrabold uppercase tracking-[0.06em] text-text">
              {t("streak_label")}
            </span>
            <Link href="/tiers" className="shrink-0">
              <TierBadge tierKey={tierKey} provisional={!ctx.confirmedTier} size="sm" />
            </Link>
          </div>
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="glow-volt-soft"
          >
            {t("checkin_button")}
          </Button>
        </Link>
      )}
    </div>
  );
}
