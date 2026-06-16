"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { JoinByCode } from "@/components/JoinByCode";
import { BrandBar } from "@/components/BrandBar";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import type { DashboardGroup } from "@/lib/groups-dashboard";

/**
 * One-line group card (Batch 2 · Section 4). The whole row taps into the
 * group's detail page — a clean, scannable directory instead of a wall of
 * expanded blocks. One compact signal: the collective streak, plus a red dot if
 * YOU haven't checked in today for this group.
 */
function GroupRow({ item, active }: { item: DashboardGroup; active: boolean }) {
  const { t } = useLanguage();
  const g = item.group;
  return (
    <Link
      href={`/groups/${g.id}`}
      className={cn(
        "flex items-center gap-3 rounded-card border bg-surface p-4 transition-colors hover:border-border-strong",
        active ? "border-volt/40" : "border-border",
      )}
    >
      <span className="relative shrink-0">
        <Avatar name={g.name} size="md" />
        {!item.youCheckedInToday && (
          <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-pill border-2 border-surface bg-danger"
            title={t("groups_at_risk")}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body font-medium text-text">{g.name}</p>
          {active && (
            <span className="shrink-0 rounded-pill bg-volt/15 px-2 py-0.5 text-caption font-medium text-volt">
              {t("groups_active_badge")}
            </span>
          )}
        </div>
        <p className="truncate text-caption text-text-dim">
          {g.goal || t("groups_members_count", { n: item.members.length })}
        </p>
      </div>

      {/* Compact signal: collective streak. */}
      <span className="flex shrink-0 items-center gap-1">
        <span aria-hidden>🔥</span>
        <span className="font-mono nums text-body text-volt">
          {item.collectiveStreak}
        </span>
      </span>

      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-text-dim" fill="none" aria-hidden>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export function GroupsDashboard({
  groups,
  activeId,
}: {
  groups: DashboardGroup[];
  activeId: string | null;
}) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <BrandBar />

      <header className="mb-6">
        <h1 className="text-h1">{t("groups_title")}</h1>
      </header>

      {groups.length === 0 ? (
        <p className="text-body text-text-muted">{t("home_no_group_subtitle")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((item) => (
            <GroupRow
              key={item.group.id}
              item={item}
              active={item.group.id === activeId}
            />
          ))}
        </div>
      )}

      {/* Create / join more */}
      <div className="mt-8 flex flex-col gap-4">
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
    </main>
  );
}
