"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Heatmap } from "@/components/Heatmap";
import { Button } from "@/components/Button";
import { SignOutButton } from "@/components/SignOutButton";
import { BrandBar } from "@/components/BrandBar";
import { Wordmark } from "@/components/Wordmark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import {
  computeLongestStreak,
  computePersonalStreak,
  localDateKey,
} from "@/lib/streaks";
import type { MemberProfileData } from "@/lib/member-profile";
import type { TranslationKey } from "@/lib/i18n";

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-5">
      <span
        className={`font-mono text-h1 nums ${accent ? "text-volt" : "text-text"}`}
      >
        {value}
      </span>
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

/**
 * Member profile screen (Batch 2 · Section 1), used for both your own profile
 * (isOwner: brand bar + account actions) and any other member's (back button,
 * read-only). Vertical order per spec: identity → hero stats → heatmap →
 * recent photos → shared groups.
 */
export function MemberProfile({ data }: { data: MemberProfileData }) {
  const { t } = useLanguage();
  const {
    profile,
    isOwner,
    statsHidden,
    checkinDates,
    totalPosts,
    recentPhotos,
    sharedGroups,
  } = data;

  const { current, longest, counts } = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of checkinDates) {
      const k = localDateKey(new Date(d));
      map[k] = (map[k] ?? 0) + 1;
    }
    return {
      current: computePersonalStreak(checkinDates, new Date()).count,
      longest: computeLongestStreak(checkinDates),
      counts: map,
    };
  }, [checkinDates]);

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
      {/* Top bar: brand for your own profile, a back button for others. */}
      {isOwner ? (
        <BrandBar />
      ) : (
        <div className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.back()}
            aria-label={t("back")}
            className="flex h-9 w-9 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <Wordmark size="sm" />
          <LanguageToggle />
        </div>
      )}

      {/* 1. Identity */}
      <div className="flex items-center gap-4">
        <Avatar name={name} src={profile.avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h2">{name}</p>
          <p className="truncate text-label text-text-muted">@{profile.username}</p>
        </div>
        {isOwner && (
          <Link href="/profile/edit">
            <Button variant="secondary">{t("profile_edit")}</Button>
          </Link>
        )}
      </div>

      {profile.bio && (
        <p className="mt-4 text-body text-text-muted">{profile.bio}</p>
      )}

      {/* 2. Hero stats — hidden if this member turned stats off (Section 2). */}
      {statsHidden ? (
        <div className="mt-8 flex items-center gap-3 rounded-card border border-border bg-surface px-5 py-6 text-text-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
            <path
              d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 4.2A9.8 9.8 0 0112 4c5 0 9 4.5 9 8a12 12 0 01-2.2 3.3M6.1 6.1A12 12 0 003 12c0 3.5 4 8 9 8a9.7 9.7 0 003.5-.65"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-body">{t("stats_hidden")}</span>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat value={current} label={t("profile_current_streak")} accent />
          <Stat value={longest} label={t("profile_longest_streak")} />
          <Stat value={totalPosts} label={t("profile_total_checkins")} />
        </div>
      )}

      {/* About (bio + identity details) */}
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

      {/* 3. Heatmap — also hidden when stats are private (it would reveal the
          streak pattern). */}
      {!statsHidden && (
        <section className="mt-10">
          <SectionLabel>{t("profile_heatmap_title")}</SectionLabel>
          <div className="mt-3 rounded-card border border-border bg-surface p-5">
            <Heatmap counts={counts} />
          </div>
        </section>
      )}

      {/* 4. Recent check-in photos */}
      <section className="mt-10">
        <SectionLabel>{t("u_recent")}</SectionLabel>
        {recentPhotos.length === 0 ? (
          <p className="mt-3 text-body text-text-dim">{t("u_no_posts")}</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {recentPhotos.map((p) => (
              <div
                key={p.id}
                className="aspect-square overflow-hidden rounded-card bg-surface-2 ring-1 ring-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- signed storage urls */}
                <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Shared groups */}
      {sharedGroups.length > 0 && (
        <section className="mt-10">
          <SectionLabel>{t("u_shared_groups")}</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {sharedGroups.map((g) => (
              <Link
                key={g.id}
                // Section 4 adds /groups/[id] detail pages; deep-link there then.
                href="/groups"
                className="flex items-center gap-2 rounded-pill border border-border bg-surface py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-border-strong"
              >
                <Avatar name={g.name} size="sm" />
                <span className="text-label text-text">{g.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Account actions (own profile only) */}
      {isOwner && (
        <div className="mt-12 flex flex-col gap-3">
          <Link href="/install">
            <Button variant="primary" fullWidth>
              {t("install_cta")}
            </Button>
          </Link>
          <SignOutButton variant="secondary" />
        </div>
      )}
    </main>
  );
}
