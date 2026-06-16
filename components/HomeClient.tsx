"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { StreakBadge } from "@/components/StreakBadge";
import { ConsistencyRing } from "@/components/ConsistencyRing";
import { FeedItem, type FeedItemData } from "@/components/FeedItem";
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
import type { FeedCheckin, FeedMember, FeedReaction } from "@/lib/feed";

type ClientCheckin = FeedCheckin & { isNew?: boolean };

// Streak lengths worth celebrating with a milestone banner.
const MILESTONES = [7, 14, 30, 60, 100, 180, 365];

export function HomeClient({
  groupId,
  userId,
  initialFeed,
  members,
  initialReactions,
  initialPersonalDates,
  initialPersonal,
  initialGroup,
  initialCheckedInToday,
}: {
  groupId: string;
  userId: string;
  initialFeed: FeedCheckin[];
  members: FeedMember[];
  initialReactions: FeedReaction[];
  initialPersonalDates: string[];
  initialPersonal: Streak;
  initialGroup: Streak;
  initialCheckedInToday: boolean;
}) {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [feed, setFeed] = useState<ClientCheckin[]>(initialFeed);
  const [reactions, setReactions] = useState<FeedReaction[]>(initialReactions);
  const [personalDates, setPersonalDates] = useState<string[]>(initialPersonalDates);

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
    setPersonal(computePersonalStreak(personalDates, now));
    const memberArrays = members.map((m) =>
      feed.filter((c) => c.user_id === m.user_id).map((c) => c.created_at),
    );
    setGroup(computeGroupStreak(memberArrays, now));
    setCheckedInToday(toDaySet(personalDates).has(localDateKey(now)));
  }, [personalDates, feed, members]);

  const refetchReactions = useCallback(async () => {
    const ids = feedRef.current.map((c) => c.id);
    if (ids.length === 0) {
      setReactions([]);
      return;
    }
    const { data } = await supabase
      .from("reactions")
      .select("checkin_id, user_id")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId, userId, nameByUser, avatarByUser, refetchReactions]);

  // Per-checkin reaction counts + whether the viewer has reacted.
  const reactionInfo = useMemo(() => {
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    for (const r of reactions) {
      counts[r.checkin_id] = (counts[r.checkin_id] ?? 0) + 1;
      if (r.user_id === userId) mine[r.checkin_id] = true;
    }
    return { counts, mine };
  }, [reactions, userId]);

  async function toggleReaction(checkinId: string) {
    const reacted = reactionInfo.mine[checkinId];
    // Optimistic update for instant feedback.
    setReactions((prev) =>
      reacted
        ? prev.filter(
            (r) => !(r.checkin_id === checkinId && r.user_id === userId),
          )
        : [...prev, { checkin_id: checkinId, user_id: userId }],
    );

    if (reacted) {
      await supabase
        .from("reactions")
        .delete()
        .eq("checkin_id", checkinId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("reactions")
        .insert({ checkin_id: checkinId, user_id: userId });
    }
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
      {/* Hero: weekly consistency ring */}
      <section className="flex flex-col items-center">
        <ConsistencyRing
          value={consistency.value}
          percent={consistency.percent}
          label={t("home_consistency")}
          sublabel={`${consistency.days}/7`}
        />
        {statusLine && (
          <p className={`mt-4 text-label ${statusLine.tone}`}>
            {statusLine.text}
          </p>
        )}

        {/* Personal + group streak as supporting stats */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
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
      ) : (
        <Link href="/checkin">
          <Button variant="primary" size="lg" fullWidth>
            {t("checkin_button")}
          </Button>
        </Link>
      )}

      {/* Live feed */}
      <section>
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
                reactionCount: reactionInfo.counts[c.id] ?? 0,
                reacted: Boolean(reactionInfo.mine[c.id]),
              };
              return (
                <FeedItem
                  key={c.id}
                  item={data}
                  isNew={c.isNew}
                  onToggleReaction={toggleReaction}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
