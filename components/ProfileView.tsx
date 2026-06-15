"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/Avatar";
import { Heatmap } from "@/components/Heatmap";
import { SignOutButton } from "@/components/SignOutButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import {
  computeLongestStreak,
  computePersonalStreak,
  toDaySet,
} from "@/lib/streaks";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-4">
      <span className="font-mono text-h1 nums text-text">{value}</span>
      <span className="mt-1 text-caption text-text-muted">{label}</span>
    </div>
  );
}

export function ProfileView({
  username,
  displayName,
  checkinDates,
}: {
  username: string;
  displayName: string | null;
  checkinDates: string[];
}) {
  const { t } = useLanguage();

  // Computed client-side with the device's local "today" — consistent with the
  // home screen's streak math.
  const { current, longest, total, daySet } = useMemo(() => {
    const now = new Date();
    return {
      current: computePersonalStreak(checkinDates, now).count,
      longest: computeLongestStreak(checkinDates),
      total: checkinDates.length,
      daySet: toDaySet(checkinDates),
    };
  }, [checkinDates]);

  const name = displayName?.trim() || `@${username}`;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-h2">{t("profile_title")}</h1>
        <LanguageToggle />
      </header>

      {/* Identity */}
      <div className="mt-8 flex items-center gap-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-h2">{name}</p>
          <p className="truncate text-label text-text-muted">@{username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={current} label={t("profile_current_streak")} />
        <Stat value={longest} label={t("profile_longest_streak")} />
        <Stat value={total} label={t("profile_total_checkins")} />
      </div>

      {/* Heatmap */}
      <section className="mt-10">
        <h2 className="text-label text-text-muted">{t("profile_heatmap_title")}</h2>
        <div className="mt-3 rounded-card border border-border bg-surface p-4">
          <Heatmap daySet={daySet} />
        </div>
      </section>

      {/* Account */}
      <div className="mt-10">
        <SignOutButton variant="secondary" />
      </div>
    </main>
  );
}
