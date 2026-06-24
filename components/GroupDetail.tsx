"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Leaderboard } from "@/components/Leaderboard";
import { NudgeButton } from "@/components/NudgeButton";
import { RemoveMemberButton } from "@/components/RemoveMemberButton";
import { PostFeed } from "@/components/PostFeed";
import { RecapCard } from "@/components/RecapCard";
import { GroupChat } from "@/components/GroupChat";
import { PactSection } from "@/components/PactSection";
import { PactAlert } from "@/components/PactAlert";
import { PenaltyNudge } from "@/components/PenaltyIntro";
import { StakesLedger } from "@/components/StakesLedger";
import { ProposalCard } from "@/components/ProposalCard";
import { isPact } from "@/lib/pacts";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { setActiveGroup, clearActiveGroup } from "@/lib/active-group";
import { cn } from "@/lib/utils";
import type { GroupDetailData } from "@/lib/group-detail";

type Window = "week" | "month" | "all";

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-caption text-text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function GroupDetail({
  data,
  userId,
  isActive,
  chatUnread,
  feed,
}: {
  data: GroupDetailData;
  userId: string;
  isActive: boolean;
  chatUnread: number;
  feed: {
    items: import("@/components/PostFeed").PostFeedItem[];
    reactions: import("@/lib/feed").FeedReaction[];
    comments: import("@/lib/feed").FeedComment[];
    userName: string;
    userAvatar: string | null;
  };
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [window, setWindow] = useState<Window>("week");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirm, setConfirm] = useState<null | "leave" | "delete">(null);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const win = data.windows[window];

  function showError(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 8000);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      /* clipboard blocked — code stays visible */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — link stays visible */
    }
  }

  function openInHome() {
    setActiveGroup(data.group.id);
    router.push("/home");
    router.refresh();
  }

  async function doLeave() {
    setWorking(true);
    const { data: rows, error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", data.group.id)
      .eq("user_id", userId)
      .select();
    setWorking(false);
    setConfirm(null);
    if (error) return showError(`${error.code ?? "ERR"}: ${error.message}`);
    if (!rows || rows.length === 0)
      return showError('Leave removed 0 rows — RLS policy "users leave groups" is missing.');
    if (isActive) clearActiveGroup();
    router.push("/groups");
    router.refresh();
  }

  async function doDelete() {
    setWorking(true);
    const { data: rows, error } = await supabase
      .from("groups")
      .delete()
      .eq("id", data.group.id)
      .select();
    setWorking(false);
    setConfirm(null);
    if (error) return showError(`${error.code ?? "ERR"}: ${error.message}`);
    if (!rows || rows.length === 0)
      return showError('Delete removed 0 rows — RLS policy "creator deletes group" is missing (or you are not the creator).');
    if (isActive) clearActiveGroup();
    router.push("/groups");
    router.refresh();
  }

  const windowOptions = [
    { value: "week" as const, label: t("activity_week") },
    { value: "month" as const, label: t("activity_month") },
    { value: "all" as const, label: t("gd_all_time") },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      {toast && (
        <button
          type="button"
          onClick={() => setToast(null)}
          className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-card border border-danger/40 bg-surface-2 px-4 py-3 text-left text-label text-danger shadow-lg"
        >
          {toast}
        </button>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/groups")}
          aria-label={t("back")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h1">{data.group.name}</h1>
          {data.group.goal && (
            <p className="truncate text-label text-text-muted">{data.group.goal}</p>
          )}
        </div>
      </div>

      {/* Pact accountability alert — loud, top of group, everyone sees it. */}
      {data.pactAlert && (
        <div className="mb-8">
          <PactAlert alert={data.pactAlert} />
        </div>
      )}

      {/* Weekly recap (Section 7) */}
      <div className="mb-8">
        <RecapCard data={data} />
      </div>

      {/* Chat entry point near the metrics (Batch 6 Stage 3). */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3 hover:border-border-strong"
        >
          <span className="flex items-center gap-2 text-body font-medium text-text">
            <span aria-hidden>💬</span>
            {t("chat_title")}
          </span>
          {!chatOpen && chatUnread > 0 && (
            <span className="flex min-w-[20px] items-center justify-center rounded-pill bg-danger px-1.5 text-caption font-bold text-white">
              {chatUnread > 99 ? "99+" : chatUnread}
            </span>
          )}
        </button>
        {chatOpen && (
          <div className="mt-3">
            <GroupChat groupId={data.group.id} userId={userId} members={data.members} />
          </div>
        )}
      </div>

      {/* Pending rule-change proposal — prominent (Batch 4 §5) */}
      {data.proposal && (
        <div className="mb-8">
          <ProposalCard proposal={data.proposal} />
        </div>
      )}

      {/* The pact: summary + about + admin setup/edit (Batch 4) */}
      <div className="mb-8">
        <PactSection group={data.group} isCreator={data.isCreator} />
      </div>

      {/* Penalty feature nudge — a group with a challenge but no stake yet.
          Only the creator can set it, so only they see the invite. */}
      {isPact(data.group) &&
        data.isCreator &&
        !(data.group.stake_value && data.group.who_pays) && (
          <div className="mb-8">
            <PenaltyNudge groupId={data.group.id} />
          </div>
        )}

      {/* Stakes ledger + broken-pact roasts (Batch 4 §3/§4) */}
      {isPact(data.group) && (
        <div className="mb-8">
          <StakesLedger
            groupId={data.group.id}
            outstanding={data.debts.outstanding}
            settled={data.debts.settled}
            hasStake={Boolean(data.group.stake_value && data.group.who_pays)}
          />
        </div>
      )}

      {/* SECTION A — group stats */}
      <section>
        <h2 className="text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("gd_group_stats")}
        </h2>

        {/* Collective streak — the hero number. */}
        <div className="mt-3 flex items-center gap-4 rounded-card border border-volt/30 bg-volt/5 p-5">
          <span aria-hidden className="text-3xl">🔥</span>
          <div>
            <p className="font-mono text-display nums leading-none text-volt">
              {data.collectiveStreak}
            </p>
            <p className="mt-1 text-label text-text-muted">
              {t("gd_collective_streak")}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <SegmentedControl options={windowOptions} value={window} onChange={(v) => setWindow(v as Window)} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label={t("gd_total_checkins")}>
            <span className="font-mono text-h1 nums text-text">{win.total}</span>
          </StatCard>
          <StatCard label={t("gd_consistency")}>
            <span className="font-mono text-h1 nums text-text">
              {data.consistencyPct}%
            </span>
          </StatCard>
        </div>

        <div className="mt-3">
          <StatCard label={t("gd_most_consistent")}>
            {win.mostConsistent ? (
              <span className="text-body text-text">
                {win.mostConsistent.name}{" "}
                <span className="text-text-muted">
                  · {t("leaderboard_days", { n: win.mostConsistent.days })}
                </span>
              </span>
            ) : (
              <span className="text-body text-text-dim">{t("gd_nobody_yet")}</span>
            )}
          </StatCard>
        </div>
      </section>

      {/* SECTION B — per-member breakdown */}
      <section className="mt-10">
        <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("gd_breakdown")}
        </h2>
        <div className="rounded-card border border-border bg-surface px-5 py-1">
          <Leaderboard
            members={data.members}
            trailing={(m) =>
              m.isYou ? null : (
                <div className="flex shrink-0 items-center gap-2">
                  {!m.checkedInToday && (
                    <NudgeButton
                      groupId={data.group.id}
                      fromUserId={userId}
                      toUserId={m.userId}
                    />
                  )}
                  {/* Owner-only remove (STACK_FIXES2 D). */}
                  {data.isCreator && (
                    <RemoveMemberButton
                      groupId={data.group.id}
                      memberUserId={m.userId}
                      memberName={m.name}
                    />
                  )}
                </div>
              )
            }
          />
        </div>
      </section>

      {/* SECTION — this group's full check-in history (Batch 6 Stage 2). */}
      {feed.items.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("feed_title")}
          </h2>
          <PostFeed
            userId={userId}
            userName={feed.userName}
            userAvatar={feed.userAvatar}
            posts={feed.items}
            initialReactions={feed.reactions}
            initialComments={feed.comments}
          />
        </section>
      )}

      {/* Open in Home */}
      <div className="mt-8">
        <Button
          variant={isActive ? "secondary" : "primary"}
          size="lg"
          fullWidth
          onClick={openInHome}
        >
          {isActive ? t("groups_open") : t("gd_open_home")}
        </Button>
      </div>

      {/* Invite: code (prominent) + full link */}
      <div className="mt-8">
        <p className="text-caption text-text-dim">{t("invite_code_label")}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="flex-1 rounded-input border border-border bg-bg px-3 py-2.5 text-center font-mono text-h2 tracking-[0.2em] text-volt">
            {data.group.invite_code}
          </code>
          <Button variant="secondary" onClick={copyCode} className="shrink-0">
            {copiedCode ? t("copied") : t("copy")}
          </Button>
        </div>

        <p className="mt-4 text-caption text-text-dim">{t("groups_invite_label")}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-input border border-border bg-bg px-3 py-2 font-mono text-caption text-text-muted">
            {data.inviteLink}
          </code>
          <Button variant="secondary" onClick={copy} className="shrink-0">
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
      </div>

      {/* Leave / delete */}
      <div className={cn("mt-6 border-t border-border pt-4")}>
        {confirm ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-label text-text-muted">
              {confirm === "delete"
                ? t("groups_delete_confirm")
                : t("groups_leave_confirm")}
            </span>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={working}>
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
            {data.isCreator && (
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
    </main>
  );
}
