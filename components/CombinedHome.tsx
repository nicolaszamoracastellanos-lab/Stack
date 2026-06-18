"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Snapshot } from "@/components/Snapshot";
import { PostFeed, type PostFeedItem } from "@/components/PostFeed";
import { useLanguage } from "@/lib/language-context";
import { localDateKey } from "@/lib/streaks";
import { setPinnedGroups } from "@/lib/pin-groups";
import type { StreakContext } from "@/lib/streak-context";
import type { CombinedItem } from "@/lib/combined-feed";
import type { FeedReaction, FeedComment } from "@/lib/feed";

export type GroupCard = {
  id: string;
  name: string;
  checkedInToday: number;
  memberCount: number;
  collectiveStreak: number;
  chatUnread: number;
};

export function CombinedHome({
  userId,
  userName,
  userAvatar,
  personalDates,
  restDays,
  ctx,
  suggestedGoal,
  items,
  reactions,
  comments,
  groupCards,
  pinnedIds,
}: {
  userId: string;
  userName: string;
  userAvatar: string | null;
  personalDates: string[];
  restDays: string[];
  ctx: StreakContext;
  suggestedGoal: number;
  items: CombinedItem[];
  reactions: FeedReaction[];
  comments: FeedComment[];
  groupCards: GroupCard[];
  pinnedIds: string[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<"activity" | "groups">("activity");

  // Build the feed items with a "posted in X[, Y]" label, split today / earlier.
  const { today, earlier } = useMemo(() => {
    const todayKey = localDateKey(new Date());
    const toFeed = (i: CombinedItem): PostFeedItem => ({
      ...i,
      groupLabel:
        i.groupNames.length > 0
          ? t("feed_posted_in", { groups: i.groupNames.join(", ") })
          : null,
    });
    const today: PostFeedItem[] = [];
    const earlier: PostFeedItem[] = [];
    for (const i of items) {
      (localDateKey(new Date(i.createdAt)) === todayKey ? today : earlier).push(toFeed(i));
    }
    return { today, earlier };
  }, [items, t]);

  const splitReactions = (its: PostFeedItem[]) => {
    const ids = new Set(its.map((i) => i.id));
    return reactions.filter((r) => ids.has(r.checkin_id));
  };
  const splitComments = (its: PostFeedItem[]) => {
    const ids = new Set(its.map((i) => i.id));
    return comments.filter((c) => ids.has(c.checkin_id));
  };

  const byId = useMemo(
    () => Object.fromEntries(groupCards.map((g) => [g.id, g])),
    [groupCards],
  );
  const pinned = pinnedIds.map((id) => byId[id]).filter(Boolean) as GroupCard[];

  async function repin(ids: string[]) {
    await setPinnedGroups(ids);
    router.refresh();
  }
  const pin = (id: string) => repin([...pinnedIds, id].slice(0, 3));
  const unpin = (id: string) => repin(pinnedIds.filter((p) => p !== id));
  const moveUp = (id: string) => {
    const i = pinnedIds.indexOf(id);
    if (i <= 0) return;
    const next = [...pinnedIds];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    repin(next);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 2.1 snapshot */}
      <Snapshot
        userId={userId}
        personalDates={personalDates}
        restDays={restDays}
        ctx={ctx}
        suggestedGoal={suggestedGoal}
      />

      {/* 2.2 pinned groups */}
      {pinned.length > 0 && (
        <section>
          <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("home_pinned")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {pinned.map((g, idx) => (
              <GroupMini
                key={g.id}
                g={g}
                pinned
                onUnpin={() => unpin(g.id)}
                onMoveUp={idx > 0 ? () => moveUp(g.id) : undefined}
                t={t}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2.3 segmented control */}
      <SegmentedControl
        options={[
          { value: "activity", label: t("home_tab_activity") },
          { value: "groups", label: t("home_tab_groups") },
        ]}
        value={tab}
        onChange={(v) => setTab(v as "activity" | "groups")}
      />

      {tab === "activity" ? (
        items.length === 0 ? (
          <EmptyFeed t={t} />
        ) : (
          <div className="flex flex-col gap-6">
            {today.length > 0 && (
              <FeedSection
                title={t("home_today")}
                items={today}
                reactions={splitReactions(today)}
                comments={splitComments(today)}
                userId={userId}
                userName={userName}
                userAvatar={userAvatar}
              />
            )}
            {earlier.length > 0 && (
              <FeedSection
                title={t("home_earlier")}
                items={earlier}
                reactions={splitReactions(earlier)}
                comments={splitComments(earlier)}
                userId={userId}
                userName={userName}
                userAvatar={userAvatar}
              />
            )}
          </div>
        )
      ) : (
        <section className="flex flex-col gap-3">
          {groupCards.map((g) => (
            <GroupRow
              key={g.id}
              g={g}
              isPinned={pinnedIds.includes(g.id)}
              canPin={pinnedIds.length < 3}
              onPin={() => pin(g.id)}
              onUnpin={() => unpin(g.id)}
              t={t}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function FeedSection({
  title,
  items,
  reactions,
  comments,
  userId,
  userName,
  userAvatar,
}: {
  title: string;
  items: PostFeedItem[];
  reactions: FeedReaction[];
  comments: FeedComment[];
  userId: string;
  userName: string;
  userAvatar: string | null;
}) {
  return (
    <section>
      <h2 className="mb-3 text-caption font-medium uppercase tracking-wide text-text-dim">
        {title}
      </h2>
      <PostFeed
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
        posts={items}
        initialReactions={reactions}
        initialComments={comments}
      />
    </section>
  );
}

function EmptyFeed({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <div className="rounded-card border border-dashed border-border px-4 py-12 text-center">
      <p className="text-h2">{t("home_feed_empty_title")}</p>
      <p className="mt-2 text-body text-text-muted">{t("home_feed_empty_body")}</p>
    </div>
  );
}

function GroupMini({
  g,
  pinned,
  onUnpin,
  onMoveUp,
  t,
}: {
  g: GroupCard;
  pinned: boolean;
  onUnpin: () => void;
  onMoveUp?: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <div className="flex min-w-[10rem] flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <Link href={`/groups/${g.id}`} className="flex items-center gap-2">
        <Avatar name={g.name} size="sm" />
        <span className="truncate text-label font-medium text-text">{g.name}</span>
        {g.chatUnread > 0 && (
          <span className="ml-auto h-2 w-2 shrink-0 rounded-pill bg-danger" aria-hidden />
        )}
      </Link>
      <p className="text-caption text-text-dim">
        {t("group_card_today", { n: g.checkedInToday })}
      </p>
      {pinned && (
        <div className="flex gap-2">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="text-caption text-text-dim hover:text-text"
              aria-label={t("home_move_up")}
            >
              ↑
            </button>
          )}
          <button
            type="button"
            onClick={onUnpin}
            className="text-caption text-text-dim hover:text-text"
          >
            {t("home_unpin")}
          </button>
        </div>
      )}
    </div>
  );
}

function GroupRow({
  g,
  isPinned,
  canPin,
  onPin,
  onUnpin,
  t,
}: {
  g: GroupCard;
  isPinned: boolean;
  canPin: boolean;
  onPin: () => void;
  onUnpin: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
      <Link href={`/groups/${g.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={g.name} size="md" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-body font-medium text-text">
            {g.name}
            {g.chatUnread > 0 && (
              <span className="h-2 w-2 shrink-0 rounded-pill bg-danger" aria-hidden />
            )}
          </p>
          <p className="text-caption text-text-dim">
            {t("group_card_today", { n: g.checkedInToday })}
            {g.collectiveStreak > 0
              ? ` · ${t("group_card_streak", { n: g.collectiveStreak })}`
              : ""}
          </p>
        </div>
      </Link>
      {isPinned ? (
        <button
          type="button"
          onClick={onUnpin}
          className="shrink-0 rounded-pill border border-volt/40 px-2.5 py-1 text-caption font-medium text-volt"
        >
          {t("home_unpin")}
        </button>
      ) : (
        <button
          type="button"
          onClick={onPin}
          disabled={!canPin}
          title={canPin ? undefined : t("home_pin_full")}
          className="shrink-0 rounded-pill border border-border px-2.5 py-1 text-caption font-medium text-text-muted hover:text-text disabled:opacity-40"
        >
          {t("home_pin")}
        </button>
      )}
    </div>
  );
}
