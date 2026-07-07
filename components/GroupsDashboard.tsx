"use client";

import Link from "next/link";
import { Avatar, avatarHue } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { JoinByCode } from "@/components/JoinByCode";
import { BrandBar } from "@/components/BrandBar";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import type { DashboardGroup } from "@/lib/groups-dashboard";

/**
 * One-line group card (Batch 2 · Section 4). The whole row taps into the
 * group's detail page — a clean, scannable directory instead of a wall of
 * expanded blocks. One compact signal: the collective streak, plus a volt dot
 * if YOU haven't checked in today for this group.
 */
function GroupRow({ item, active }: { item: DashboardGroup; active: boolean }) {
  const { t } = useLanguage();
  const g = item.group;
  const hue = avatarHue(g.name);
  return (
    <Link
      href={`/groups/${g.id}`}
      className={cn(
        "depth relative flex items-center gap-3 overflow-hidden rounded-card border p-4 transition-colors",
        active
          ? "glow-volt-soft border-volt/40"
          : "border-border hover:border-border-strong",
      )}
      style={{
        // The group's monogram color bleeds softly across the card, layered
        // over the depth gradient (inline background-image overrides the
        // class's, so both layers are declared here; .depth keeps the shadow).
        backgroundImage: `radial-gradient(circle at 12% 50%, hsla(${hue}, 80%, 60%, 0.10), transparent 60%), linear-gradient(180deg, #1c1c1f 0%, #141416 100%)`,
      }}
    >
      <span className="relative shrink-0">
        <Avatar name={g.name} size="lg" />
        {!item.youCheckedInToday && (
          <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-pill border-2 border-surface bg-volt"
            title={t("groups_at_risk")}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Display WEIGHT only — user content never gets uppercased. */}
          <p className="truncate text-body font-black text-text" style={{ fontStretch: "110%" }}>
            {g.name}
          </p>
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

      {/* Compact signal: collective streak, as a quiet pill chip. */}
      <span className="flex shrink-0 items-center gap-1 rounded-pill border border-border px-2.5 py-1 text-label">
        <span aria-hidden>🔥</span>
        <span className="nums font-semibold text-volt">
          {item.collectiveStreak}
        </span>
      </span>

      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-text-dim" fill="none" aria-hidden>
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
        <p className="eyebrow mb-1.5">{t("nav_groups")}</p>
        <h1 className="type-display text-[28px] leading-none">{t("groups_title")}</h1>
      </header>

      {groups.length === 0 ? (
        <div className="depth flex flex-col items-center gap-5 rounded-card border border-border px-6 py-10 text-center">
          {/* Summit-stack motif: three rounded bars climbing to a volt peak. */}
          <div className="flex items-end gap-1.5" aria-hidden>
            <span className="h-6 w-3.5 rounded-pill border border-border bg-surface-2" />
            <span className="h-10 w-3.5 rounded-pill border border-border-strong bg-surface-2" />
            <span className="h-14 w-3.5 rounded-pill bg-volt" />
          </div>
          <div>
            <p className="text-h2 text-text">{t("home_no_group_title")}</p>
            <p className="mt-1.5 text-body text-text-muted">
              {t("home_no_group_subtitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-3">
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
