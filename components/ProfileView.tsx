"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Heatmap } from "@/components/Heatmap";
import { Button } from "@/components/Button";
import { SignOutButton } from "@/components/SignOutButton";
import { BrandBar } from "@/components/BrandBar";
import { useLanguage } from "@/lib/language-context";
import {
  computeLongestStreak,
  computePersonalStreak,
  toDaySet,
} from "@/lib/streaks";
import type { Profile } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-5">
      <span className="font-mono text-h1 nums text-text">{value}</span>
      <span className="mt-1 text-caption text-text-muted">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-caption font-medium uppercase tracking-wide text-text-dim">
      {children}
    </h2>
  );
}

function AboutRow({ labelKey, value }: { labelKey: TranslationKey; value: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-0.5 border-t border-border py-3 first:border-t-0 first:pt-0">
      <span className="text-caption uppercase tracking-wide text-text-dim">
        {t(labelKey)}
      </span>
      <span className="text-body text-text">{value}</span>
    </div>
  );
}

export function ProfileView({
  profile,
  checkinDates,
  totalPosts,
}: {
  profile: Profile;
  checkinDates: string[];
  totalPosts: number;
}) {
  const { t } = useLanguage();

  const { current, longest, daySet } = useMemo(() => {
    const now = new Date();
    return {
      current: computePersonalStreak(checkinDates, now).count,
      longest: computeLongestStreak(checkinDates),
      daySet: toDaySet(checkinDates),
    };
  }, [checkinDates]);
  const total = totalPosts;

  const name = profile.display_name?.trim() || `@${profile.username}`;

  const aboutRows: { key: TranslationKey; value: string | null }[] = [
    { key: "profile_favorite_sport_label", value: profile.favorite_sport },
    { key: "profile_usual_activity_label", value: profile.usual_activity },
    { key: "profile_focus_sport_label", value: profile.focus_sport },
  ];
  const hasAbout =
    profile.bio || aboutRows.some((r) => r.value && r.value.trim());

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <BrandBar />
      <h1 className="text-h2">{t("profile_title")}</h1>

      {/* Identity */}
      <div className="mt-8 flex items-center gap-4">
        <Avatar name={name} src={profile.avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h2">{name}</p>
          <p className="truncate text-label text-text-muted">@{profile.username}</p>
        </div>
        <Link href="/profile/edit">
          <Button variant="secondary">{t("profile_edit")}</Button>
        </Link>
      </div>

      {profile.bio && (
        <p className="mt-4 text-body text-text-muted">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={current} label={t("profile_current_streak")} />
        <Stat value={longest} label={t("profile_longest_streak")} />
        <Stat value={total} label={t("profile_total_checkins")} />
      </div>

      {/* About */}
      {hasAbout && (
        <section className="mt-10">
          <SectionLabel>{t("profile_about")}</SectionLabel>
          <div className="mt-3 rounded-card border border-border bg-surface px-5 py-1">
            {aboutRows
              .filter((r) => r.value && r.value.trim())
              .map((r) => (
                <AboutRow key={r.key} labelKey={r.key} value={r.value!.trim()} />
              ))}
          </div>
        </section>
      )}

      {/* Heatmap */}
      <section className="mt-10">
        <SectionLabel>{t("profile_heatmap_title")}</SectionLabel>
        <div className="mt-3 rounded-card border border-border bg-surface p-5">
          <Heatmap daySet={daySet} />
        </div>
      </section>

      {/* Account */}
      <div className="mt-10 flex flex-col gap-3">
        <Link href="/install">
          <Button variant="primary" fullWidth>
            {t("install_cta")}
          </Button>
        </Link>
        <SignOutButton variant="secondary" />
      </div>
    </main>
  );
}
