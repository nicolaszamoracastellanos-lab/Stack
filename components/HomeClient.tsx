"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { StreakBadge } from "@/components/StreakBadge";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { FeedItem, type FeedItemData } from "@/components/FeedItem";
import { NudgeBanner } from "@/components/NudgeBanner";
import { useLanguage } from "@/lib/language-context";
import { useCountUp } from "@/lib/use-count-up";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET } from "@/lib/storage";
import {
  computePersonalStreak,
  computeGroupStreak,
  localDateKey,
  toDaySet,
  type Streak,
} from "@/lib/streaks";
import type {
  FeedCheckin,
  FeedComment,
  FeedMember,
  FeedReaction,
} from "@/lib/feed";
import type { ReactionAgg } from "@/lib/reactions";

type ClientCheckin = FeedCheckin & { isNew?: boolean };

// Streak lengths worth celebrating with a milestone banner.
const MILESTONES = [7, 14, 30, 60, 100, 180, 365];

export function HomeClient({
  groupId,
  userId,
  initialFeed,
  members,
  initialReactions,
  initialComments,
  initialPersonalDates,
  initialRestDays,
  initialPersonal,
  initialGroup,
  initialCheckedInToday,
}: {
  groupId: string;
  userId: string;
  initialFeed: FeedCheckin[];
  members: FeedMember[];
  initialReactions: FeedReaction[];
  initialComments: FeedComment[];
  initialPersonalDates: string[];
  initialRestDays: string[];
  initialPersonal: Streak;
  initialGroup: Streak;
  initialCheckedInToday: boolean;
}) {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [feed, setFeed] = useState<ClientCheckin[]>(initialFeed);
  const [reactions, setReactions] = useState<FeedReaction[]>(initialReactions);
  const [comments, setComments] = useState<FeedComment[]>(initialComments);
  const [personalDates, setPersonalDates] = useState<string[]>(initialPersonalDates);
  const [restDays, setRestDays] = useState<string[]>(initialRestDays);

  // Streak state. Seeded from server-computed values (so SSR and first client
  // render match), then recomputed client-side with the device's local "today".
  const [personal, setPersonal] = useState<Streak>(initialPersonal);
  const [group, setGroup] = useState<Streak>(initialGroup);
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday);

  const nameByUser = useMemo(
    () => Object.fromEntries(members.map((m) => [m.user_id, m.name])),
    [members],
  );
  const avatarByUser = useMemo(
    () => Object.fromEntries(members.map((m) => [m.user_id, m.avatarUrl])),
    [members],
  );

  // Keep refs fresh for use inside realtime callbacks (stable subscription).
  const feedRef = useRef(feed);
  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  // Recompute streaks whenever the underlying data changes, using local time.
  useEffect(() => {
    const now = new Date();
    setPersonal(computePersonalStreak(personalDates, now, restDays));
    const memberArrays = members.map((m) =>
      feed.filter((c) => c.user_id === m.user_id).map((c) => c.created_at),
    );
    setGroup(computeGroupStreak(memberArrays, now));
    setCheckedInToday(toDaySet(personalDates).has(localDateKey(now)));
  }, [personalDates, feed, members, restDays]);

  // Rest day (§9): you can mark today off to protect the streak. Weekly
  // allowance of one keeps it from feeling like cheating.
  const todayKey = localDateKey(new Date());
  const restedToday = restDays.includes(todayKey);
  const restsThisWeek = useMemo(() => {
    const set = new Set(restDays);
    let n = 0;
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (set.has(localDateKey(d))) n++;
    }
    return n;
  }, [restDays]);

  async function markRestDay() {
    if (restedToday || restsThisWeek >= 1) return;
    setRestDays((prev) => [...prev, todayKey]); // optimistic
    const { error } = await supabase
      .from("rest_days")
      .insert({ user_id: userId, day: todayKey });
    if (error && error.code !== "23505") {
      setRestDays((prev) => prev.filter((d) => d !== todayKey)); // roll back
    }
  }

  const refetchReactions = useCallback(async () => {
    const ids = feedRef.current.map((c) => c.id);
    if (ids.length === 0) {
      setReactions([]);
      return;
    }
    const { data } = await supabase
      .from("reactions")
      .select("checkin_id, user_id, emoji")
      .in("checkin_id", ids);
    setReactions((data ?? []) as FeedReaction[]);
  }, [supabase]);

  // Realtime: new check-ins appear at the top live; reaction changes refetch.
  useEffect(() => {
    const channel = supabase
      .channel(`home:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkins",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const c = payload.new as FeedCheckin & { photo_url: string };
          if (feedRef.current.some((f) => f.id === c.id)) return; // dedupe

          const { data: signed } = await supabase.storage
            .from(CHECKINS_BUCKET)
            .createSignedUrl(c.photo_url, 60 * 60);

          let name = nameByUser[c.user_id];
          let avatarUrl = avatarByUser[c.user_id] ?? null;
          if (!name) {
            const { data: p } = await supabase
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("id", c.user_id)
              .maybeSingle();
            name = p?.display_name?.trim() || (p ? `@${p.username}` : "Member");
            avatarUrl = p?.avatar_url ?? null;
          }

          const item: ClientCheckin = {
            id: c.id,
            user_id: c.user_id,
            name,
            avatarUrl,
            photoUrl: signed?.signedUrl ?? "",
            note: c.note ?? null,
            sport: c.sport ?? null,
            environment: c.environment ?? null,
            goal: c.goal ?? null,
            created_at: c.created_at,
            isNew: true,
          };
          setFeed((prev) => [item, ...prev]);
          if (c.user_id === userId) {
            setPersonalDates((prev) => [c.created_at, ...prev]);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => {
          // A reaction changed somewhere; reconcile the ones we display.
          refetchReactions();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const c = payload.new as FeedComment & { user_id: string };
          if (!feedRef.current.some((f) => f.id === c.checkin_id)) return;
          setComments((prev) =>
            prev.some((x) => x.id === c.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: c.id,
                    checkin_id: c.checkin_id,
                    user_id: c.user_id,
                    name: nameByUser[c.user_id] ?? "Member",
                    avatarUrl: avatarByUser[c.user_id] ?? null,
                    body: c.body,
                    created_at: c.created_at,
                  },
                ],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) setComments((prev) => prev.filter((c) => c.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId, userId, nameByUser, avatarByUser, refetchReactions]);

  // Per-checkin, per-emoji aggregate: count, whether you reacted, and who.
  const reactionAgg = useMemo(() => {
    const out: Record<string, ReactionAgg> = {};
    for (const r of reactions) {
      const byEmoji = (out[r.checkin_id] ??= {});
      const cell = (byEmoji[r.emoji] ??= { count: 0, mine: false, who: [] });
      cell.count++;
      if (r.user_id === userId) cell.mine = true;
      cell.who.push(
        r.user_id === userId ? t("groups_you_tag") : nameByUser[r.user_id] ?? "Member",
      );
    }
    return out;
  }, [reactions, userId, nameByUser, t]);

  // Comments grouped per check-in (server returns them oldest-first).
  const commentsByCheckin = useMemo(() => {
    const out: Record<string, FeedComment[]> = {};
    for (const c of comments) (out[c.checkin_id] ??= []).push(c);
    return out;
  }, [comments]);

  async function toggleReaction(checkinId: string, emoji: string) {
    const mine = reactionAgg[checkinId]?.[emoji]?.mine ?? false;
    // Optimistic update for instant feedback.
    setReactions((prev) =>
      mine
        ? prev.filter(
            (r) =>
              !(r.checkin_id === checkinId && r.user_id === userId && r.emoji === emoji),
          )
        : [...prev, { checkin_id: checkinId, user_id: userId, emoji }],
    );
    if (mine) {
      await supabase
        .from("reactions")
        .delete()
        .eq("checkin_id", checkinId)
        .eq("user_id", userId)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("reactions")
        .insert({ checkin_id: checkinId, user_id: userId, emoji });
    }
  }

  async function addComment(checkinId: string, body: string) {
    const { data, error } = await supabase
      .from("comments")
      .insert({ checkin_id: checkinId, user_id: userId, body })
      .select("id, checkin_id, user_id, body, created_at")
      .single();
    if (error || !data) return;
    setComments((prev) =>
      prev.some((c) => c.id === data.id)
        ? prev
        : [
            ...prev,
            {
              id: data.id as string,
              checkin_id: data.checkin_id as string,
              user_id: data.user_id as string,
              name: nameByUser[userId] ?? "You",
              avatarUrl: avatarByUser[userId] ?? null,
              body: data.body as string,
              created_at: data.created_at as string,
            },
          ],
    );
  }

  async function deleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await supabase.from("comments").delete().eq("id", commentId);
  }

  const displayedStreak = useCountUp(personal.count);

  // Weekly consistency: share of the last 7 days the user checked in (any group).
  const consistency = useMemo(() => {
    const now = new Date();
    const set = toDaySet(personalDates);
    let days = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (set.has(localDateKey(d))) days++;
    }
    return { days, value: days / 7, percent: Math.round((days / 7) * 100) };
  }, [personalDates]);

  // Status line under the streak. Only surfaced for the costly states — when
  // the streak is alive the green confirmation CTA already says "you showed up".
  const statusLine =
    personal.state === "broken"
      ? { text: t("streak_broken"), tone: "text-danger" }
      : personal.state === "at-risk"
        ? { text: t("streak_at_risk"), tone: "text-danger" }
        : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Someone nudged you today (Section 6). */}
      <NudgeBanner userId={userId} />

      {/* Hero: weekly consistency ring */}
      <section className="flex flex-col items-center">
        <div data-tour="ring">
          <ConsistencyRing
            value={consistency.value}
            percent={consistency.percent}
            label={t("home_consistency")}
            sublabel={`${consistency.days}/7`}
          />
        </div>
        {statusLine && (
          <p className={`mt-4 text-label ${statusLine.tone}`}>
            {statusLine.text}
          </p>
        )}

        {/* Personal + group streak as supporting stats */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3" data-tour="streaks">
          <div className="rounded-card border border-border bg-surface p-5">
            <StreakBadge
              count={displayedStreak}
              label={t("streak_label")}
              state={personal.state}
              size="md"
            />
          </div>
          <div className="rounded-card border border-border bg-surface p-5">
            <StreakBadge
              count={group.count}
              label={t("group_streak_label")}
              state={group.state}
              size="md"
            />
          </div>
        </div>
      </section>

      {/* Milestone moment — celebrate hitting a meaningful streak. */}
      {MILESTONES.includes(personal.count) && (
        <div className="rounded-card border border-volt/40 bg-volt/10 px-4 py-4">
          <p className="text-h2 text-volt">
            🔥 {t("milestone_title", { n: personal.count })}
          </p>
          <p className="mt-1 text-label text-text-muted">{t("milestone_sub")}</p>
        </div>
      )}

      {/* Check-in CTA */}
      {checkedInToday ? (
        <div className="flex items-center gap-3 rounded-card border border-volt/30 bg-volt/10 px-4 py-4">
          <span aria-hidden className="text-xl">✓</span>
          <p className="text-body font-medium text-volt">{t("checkin_done")}</p>
        </div>
      ) : restedToday ? (
        <div className="flex items-center gap-3 rounded-card border border-border-strong bg-surface px-4 py-4">
          <span aria-hidden className="text-xl">😌</span>
          <p className="text-body font-medium text-text">{t("rest_day_done")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Link href="/checkin" className="w-full">
            <Button variant="primary" size="lg" fullWidth>
              {t("checkin_button")}
            </Button>
          </Link>
          {restsThisWeek < 1 && (
            <button
              type="button"
              onClick={markRestDay}
              className="text-caption text-text-dim underline-offset-4 hover:text-text hover:underline"
            >
              {t("rest_day_cta")}
            </button>
          )}
        </div>
      )}

      {/* Live feed */}
      <section data-tour="feed">
        <h2 className="mb-3 text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("feed_title")}
        </h2>
        {feed.length === 0 ? (
          <div className="rounded-card border border-dashed border-border px-4 py-10 text-center">
            <p className="text-body text-text-dim">{t("feed_empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {feed.map((c) => {
              const data: FeedItemData = {
                id: c.id,
                userId: c.user_id,
                name: c.name,
                avatarUrl: c.avatarUrl,
                photoUrl: c.photoUrl,
                note: c.note,
                sport: c.sport,
                environment: c.environment,
                goal: c.goal,
                createdAt: c.created_at,
              };
              return (
                <FeedItem
                  key={c.id}
                  item={data}
                  isNew={c.isNew}
                  reactions={reactionAgg[c.id] ?? {}}
                  comments={commentsByCheckin[c.id] ?? []}
                  currentUserId={userId}
                  onToggleReaction={toggleReaction}
                  onAddComment={addComment}
                  onDeleteComment={deleteComment}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
