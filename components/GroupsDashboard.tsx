"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { JoinByCode } from "@/components/JoinByCode";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import { setActiveGroup } from "@/lib/active-group";
import { cn } from "@/lib/utils";
import type { DashboardGroup, LeaderEntry } from "@/lib/groups-dashboard";

function RankBadge({ index }: { index: number }) {
  const top = index === 0;
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-caption font-bold",
        top ? "bg-volt text-bg" : "border border-border text-text-muted",
      )}
    >
      {index + 1}
    </span>
  );
}

function Leaderboard({ members }: { members: LeaderEntry[] }) {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col gap-2">
      {members.map((m, i) => (
        <li key={m.userId} className="flex items-center gap-3">
          <RankBadge index={i} />
          <span className="min-w-0 flex-1 truncate text-body">
            {m.name}
            {m.isYou && (
              <span className="ml-2 text-caption text-text-dim">
                ({t("groups_you_tag")})
              </span>
            )}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-label nums",
              i === 0 ? "text-volt" : "text-text-muted",
            )}
          >
            {m.streak}
            <span aria-hidden>🔥</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function GroupCard({
  item,
  active,
  baseUrl,
}: {
  item: DashboardGroup;
  active: boolean;
  baseUrl: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const link = `${baseUrl}/join/${item.group.invite_code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — link stays visible to copy manually
    }
  }

  function open() {
    setActiveGroup(item.group.id);
    router.push("/home");
    router.refresh();
  }

  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-4",
        active ? "border-volt/40" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-h2">{item.group.name}</h2>
            {active && (
              <span className="shrink-0 rounded-pill bg-volt/15 px-2 py-0.5 text-caption font-medium text-volt">
                {t("groups_active_badge")}
              </span>
            )}
          </div>
          {item.group.goal && (
            <p className="mt-1 truncate text-label text-text-muted">
              {item.group.goal}
            </p>
          )}
          <p className="mt-1 text-caption text-text-dim">
            {t("groups_members_count", { n: item.members.length })}
          </p>
        </div>
        <Button variant={active ? "secondary" : "primary"} onClick={open}>
          {active ? t("groups_open") : t("groups_set_active")}
        </Button>
      </div>

      {/* Leaderboard */}
      <div className="mt-4">
        <p className="mb-2 text-caption uppercase tracking-wide text-text-dim">
          {t("groups_leaderboard")}
        </p>
        <Leaderboard members={item.members} />
      </div>

      {/* Invite link */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-caption text-text-dim">{t("groups_invite_label")}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-input border border-border bg-bg px-3 py-2 font-mono text-caption text-text-muted">
            {link}
          </code>
          <Button variant="secondary" onClick={copy} className="shrink-0">
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GroupsDashboard({
  groups,
  activeId,
  baseUrl,
}: {
  groups: DashboardGroup[];
  activeId: string | null;
  baseUrl: string;
}) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-h1">{t("groups_title")}</h1>
        <LanguageToggle />
      </header>

      {groups.length === 0 ? (
        <p className="text-body text-text-muted">
          {t("home_no_group_subtitle")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((item) => (
            <GroupCard
              key={item.group.id}
              item={item}
              active={item.group.id === activeId}
              baseUrl={baseUrl}
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
          <span className="text-caption text-text-dim">
            {t("home_join_group")}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <JoinByCode />
      </div>
    </main>
  );
}
