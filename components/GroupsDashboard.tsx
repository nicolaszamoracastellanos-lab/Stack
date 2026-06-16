"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { JoinByCode } from "@/components/JoinByCode";
import { BrandBar } from "@/components/BrandBar";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { setActiveGroup, clearActiveGroup } from "@/lib/active-group";
import { cn } from "@/lib/utils";
import type { DashboardGroup, LeaderEntry } from "@/lib/groups-dashboard";

function Leaderboard({ members }: { members: LeaderEntry[] }) {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col">
      {members.map((m, i) => (
        <li
          key={m.userId}
          className="flex items-center gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
        >
          <span className="w-4 shrink-0 text-center font-mono text-caption text-text-dim">
            {i + 1}
          </span>
          {/* Avatar with an at-risk red dot when they haven't checked in today. */}
          <span className="relative shrink-0">
            <Avatar name={m.name} src={m.avatarUrl} size="md" />
            {!m.checkedInToday && (
              <span
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-pill border-2 border-surface bg-danger"
                title="hasn't checked in today"
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium text-text">
              {m.name}
              {m.isYou && (
                <span className="ml-1.5 text-caption text-text-dim">
                  ({t("groups_you_tag")})
                </span>
              )}
            </p>
            <p className="text-caption text-text-dim">
              {t("leaderboard_days", { n: m.daysThisWeek })}
            </p>
          </div>
          <span className="font-mono text-h1 nums leading-none text-volt">
            {m.streak}
          </span>
        </li>
      ))}
    </ul>
  );
}

function GroupCard({
  item,
  active,
  userId,
  baseUrl,
  onError,
}: {
  item: DashboardGroup;
  active: boolean;
  userId: string;
  baseUrl: string;
  onError: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<null | "leave" | "delete">(null);
  const [working, setWorking] = useState(false);

  const isCreator = item.group.created_by === userId;
  const link = `${baseUrl}/join/${item.group.invite_code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — link stays visible */
    }
  }

  function open() {
    setActiveGroup(item.group.id);
    router.push("/home");
    router.refresh();
  }

  // We .select() the deleted rows so a silent RLS block (0 rows, no error) is
  // detected. The REAL Postgres error (code/message/details/hint) is surfaced
  // and logged — never a generic "couldn't do that".
  async function doLeave() {
    setWorking(true);
    const { data, error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", item.group.id)
      .eq("user_id", userId)
      .select();
    setWorking(false);
    setConfirm(null);
    if (error) {
      console.error("[leave group] error:", error);
      onError(`${error.code ?? "ERR"}: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      console.error("[leave group] 0 rows deleted — RLS likely blocking");
      onError("Leave removed 0 rows — RLS policy \"users leave groups\" is missing.");
      return;
    }
    if (active) clearActiveGroup();
    router.refresh();
  }

  async function doDelete() {
    setWorking(true);
    const { data, error } = await supabase
      .from("groups")
      .delete()
      .eq("id", item.group.id)
      .select();
    setWorking(false);
    setConfirm(null);
    if (error) {
      console.error("[delete group] error:", error);
      onError(`${error.code ?? "ERR"}: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      console.error("[delete group] 0 rows deleted — RLS likely blocking");
      onError(
        "Delete removed 0 rows — RLS policy \"creator deletes group\" is missing (or you're not the creator).",
      );
      return;
    }
    if (active) clearActiveGroup();
    router.refresh();
  }

  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-5",
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
            {t("groups_members_count", { n: item.members.length })} ·{" "}
            {t("groups_week_checkins", { n: item.weekTotal })}
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

      {/* Leave / delete */}
      <div className="mt-4 border-t border-border pt-3">
        {confirm ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-label text-text-muted">
              {confirm === "delete"
                ? t("groups_delete_confirm")
                : t("groups_leave_confirm")}
            </span>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirm(null)}
                disabled={working}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={confirm === "delete" ? doDelete : doLeave}
                disabled={working}
              >
                {working ? t("loading") : t("groups_confirm_yes")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setConfirm("leave")}
              className="text-label text-text-muted hover:text-danger"
            >
              {t("groups_leave")}
            </button>
            {isCreator && (
              <button
                type="button"
                onClick={() => setConfirm("delete")}
                className="text-label text-danger hover:text-danger-dim"
              >
                {t("groups_delete")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function GroupsDashboard({
  groups,
  activeId,
  userId,
  baseUrl,
}: {
  groups: DashboardGroup[];
  activeId: string | null;
  userId: string;
  baseUrl: string;
}) {
  const { t } = useLanguage();
  const [toast, setToast] = useState<string | null>(null);

  function showError(msg: string) {
    setToast(msg);
    // Longer dwell so the real error is readable.
    setTimeout(() => setToast(null), 8000);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      {/* Error toast — shows the REAL error so failures are never silent. */}
      {toast && (
        <button
          type="button"
          onClick={() => setToast(null)}
          className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-card border border-danger/40 bg-surface-2 px-4 py-3 text-left text-label text-danger shadow-lg"
        >
          {toast}
        </button>
      )}

      <BrandBar />

      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-h1">{t("groups_title")}</h1>
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
              userId={userId}
              baseUrl={baseUrl}
              onError={showError}
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
