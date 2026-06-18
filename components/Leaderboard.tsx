"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { useLanguage } from "@/lib/language-context";
import type { LeaderEntry } from "@/lib/groups-dashboard";

/** Small 7-day consistency ring (value 0–1). */
function MiniRing({ value }: { value: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="3" className="stroke-border-strong" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-volt"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-text-dim" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth={1.6} />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

/**
 * Per-member breakdown (Batch 2 · Section 4B). Each row: rank, avatar with the
 * at-risk red dot, name, a small consistency ring, and the current streak.
 * Tapping a row opens that member's profile. Privacy-aware (Section 2):
 * hidden-stat members keep name/avatar/at-risk but hide rank/ring/streak.
 *
 * `trailing` lets the caller append a per-row action (e.g. the Section 6 Nudge
 * button) without this component owning that logic.
 */
export function Leaderboard({
  members,
  trailing,
}: {
  members: LeaderEntry[];
  trailing?: (m: LeaderEntry) => React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col">
      {members.map((m, i) => (
        <li
          key={m.userId}
          className="flex items-center gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
        >
          <span className="w-4 shrink-0 text-center font-mono text-caption text-text-dim">
            {m.showStats ? i + 1 : "—"}
          </span>
          <Link href={`/u/${m.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative shrink-0">
              <Avatar name={m.name} src={m.avatarUrl} size="md" />
              {!m.checkedInToday && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-pill border-2 border-surface bg-danger"
                  title={t("groups_at_risk")}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-body font-medium text-text">
                <span className="truncate">{m.name}</span>
                {m.isYou && (
                  <span className="shrink-0 text-caption text-text-dim">
                    ({t("groups_you_tag")})
                  </span>
                )}
              </p>
              {/* Tier badge next to the name (STACK_FIXES2 B) — colour + name
                  disambiguates equal streak lengths. */}
              {m.tier && (
                <div className="mt-1">
                  <TierBadge tierKey={m.tier} size="sm" />
                </div>
              )}
              <p className="text-caption text-text-dim">
                {m.showStats
                  ? t("leaderboard_days", { n: m.daysThisWeek })
                  : t("stats_hidden")}
              </p>
            </div>
          </Link>
          {m.showStats ? (
            <>
              <MiniRing value={m.daysThisWeek / 7} />
              <span className="w-6 text-right font-mono text-h2 nums leading-none text-volt">
                {m.streak}
              </span>
            </>
          ) : (
            <LockIcon />
          )}
          {trailing?.(m)}
        </li>
      ))}
    </ul>
  );
}
