"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { tierForFrequency } from "@/lib/tiers";
import { TierBadge } from "@/components/TierBadge";
import { nextWeekStartKey } from "@/lib/week";
import { cn } from "@/lib/utils";

/**
 * One-screen weekly-goal setup (Batch 5 C5/C6). Shown when the user has no goal
 * yet — new users after onboarding and existing users on conversion. Skippable
 * with a forgiving default. Quota rules always start NEXT Monday, so an existing
 * streak is never broken mid-week on conversion (grace).
 */
export function GoalSetup({
  userId,
  suggested,
}: {
  userId: string;
  /** Forgiving default (recent observed average, floored), used by Skip too. */
  suggested: number;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState<number>(Math.max(1, Math.min(7, suggested)));
  const [busy, setBusy] = useState(false);

  async function commit(goal: number) {
    setBusy(true);
    const activation = nextWeekStartKey(new Date());
    const { error } = await createClient()
      .from("profiles")
      .update({ weekly_goal: goal, quota_active_from: activation })
      .eq("id", userId);
    if (error) {
      setBusy(false);
      return;
    }
    router.refresh();
  }

  const rest = 7 - q;
  const restHint =
    rest === 0
      ? t("goal_rest_hint_none")
      : rest === 1
        ? t("goal_rest_hint_one")
        : t("goal_rest_hint", { n: rest });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-6 py-10">
        {/* Tier intro (the onboarding addition, kept to one card). */}
        <div className="rounded-card border border-volt/30 bg-volt/10 p-5">
          <h2 className="text-h2 text-volt">{t("goal_intro_title")}</h2>
          <p className="mt-1 text-label text-text-muted">{t("goal_intro_body")}</p>
        </div>

        <h1 className="mt-8 text-h1">{t("goal_title")}</h1>
        <p className="mt-2 text-body text-text-muted">{t("goal_sub")}</p>

        <div className="mt-6 grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQ(n)}
              aria-pressed={q === n}
              className={cn(
                "flex h-14 items-center justify-center rounded-card border text-h2 font-bold transition-colors",
                q === n
                  ? "border-volt bg-volt/15 text-volt"
                  : "border-border bg-surface text-text-muted hover:border-border-strong",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-3 text-center text-label text-text">
          {t("goal_per_week", { n: q })}
        </p>
        <p className="mt-1 text-center text-caption text-text-dim">{restHint}</p>

        {/* Live preview of the tier this goal sits at. */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="text-caption text-text-dim">{t("tier_level_label")}:</span>
          <TierBadge tierKey={tierForFrequency(q)?.key ?? null} />
        </div>

        <p className="mt-6 rounded-card border border-border bg-surface px-4 py-3 text-caption text-text-muted">
          {t("goal_grace_note")}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => commit(q)}
          >
            {t("goal_save")}
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={() => commit(suggested)}
            className="text-center text-label text-text-dim underline-offset-4 hover:text-text hover:underline disabled:opacity-50"
          >
            {t("goal_skip")}
          </button>
          <Link
            href="/tiers"
            className="text-center text-caption text-volt underline-offset-4 hover:underline"
          >
            {t("tierguide_link")}
          </Link>
        </div>
      </div>
    </div>
  );
}
