"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedItem, type FeedItemData } from "@/components/FeedItem";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { deleteCheckinPost } from "@/lib/checkins";
import { emitPush } from "@/lib/push/emit";
import type { FeedReaction, FeedComment } from "@/lib/feed";
import type { ReactionAgg } from "@/lib/reactions";
import type { TierKey } from "@/lib/tiers";

export type PostFeedItem = {
  id: string;
  postId: string | null;
  userId: string;
  name: string;
  avatarUrl: string | null;
  tier: TierKey | null;
  photoUrl: string;
  photoPath: string;
  note: string | null;
  sport: string | null;
  environment: string | null;
  goal: string | null;
  createdAt: string;
  groupLabel?: string | null;
};

/**
 * Reusable post feed (STACK_BATCH6 Stage 2). Renders posts with reactions and
 * comments (reusing FeedItem), with optimistic reaction/comment/delete. Used by
 * the combined "All Activity" feed and a single group's feed. Reaction/comment
 * inserts notify the post author via the unified emit flow.
 */
export function PostFeed({
  userId,
  userName,
  userAvatar,
  posts,
  initialReactions,
  initialComments,
}: {
  userId: string;
  userName: string;
  userAvatar: string | null;
  posts: PostFeedItem[];
  initialReactions: FeedReaction[];
  initialComments: FeedComment[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<PostFeedItem[]>(posts);
  const [reactions, setReactions] = useState<FeedReaction[]>(initialReactions);
  const [comments, setComments] = useState<FeedComment[]>(initialComments);

  const reactionAgg = useMemo(() => {
    const out: Record<string, ReactionAgg> = {};
    for (const r of reactions) {
      const byEmoji = (out[r.checkin_id] ??= {});
      const cell = (byEmoji[r.emoji] ??= { count: 0, mine: false, who: [] });
      cell.count++;
      if (r.user_id === userId) cell.mine = true;
      cell.who.push(r.user_id === userId ? t("groups_you_tag") : "Member");
    }
    return out;
  }, [reactions, userId, t]);

  const commentsByCheckin = useMemo(() => {
    const out: Record<string, FeedComment[]> = {};
    for (const c of comments) (out[c.checkin_id] ??= []).push(c);
    return out;
  }, [comments]);

  async function toggleReaction(checkinId: string, emoji: string) {
    const mine = reactionAgg[checkinId]?.[emoji]?.mine ?? false;
    setReactions((prev) =>
      mine
        ? prev.filter(
            (r) => !(r.checkin_id === checkinId && r.user_id === userId && r.emoji === emoji),
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
      const { error } = await supabase
        .from("reactions")
        .insert({ checkin_id: checkinId, user_id: userId, emoji });
      if (!error) emitPush({ event: "reaction", checkinId });
    }
  }

  async function addComment(checkinId: string, body: string) {
    const { data, error } = await supabase
      .from("comments")
      .insert({ checkin_id: checkinId, user_id: userId, body })
      .select("id, checkin_id, user_id, body, created_at")
      .single();
    if (error || !data) return;
    emitPush({ event: "comment", checkinId, snippet: body });
    setComments((prev) =>
      prev.some((c) => c.id === data.id)
        ? prev
        : [
            ...prev,
            {
              id: data.id as string,
              checkin_id: data.checkin_id as string,
              user_id: data.user_id as string,
              name: userName,
              avatarUrl: userAvatar,
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

  const deleteCheckin = useCallback(
    async (checkinId: string): Promise<string | null> => {
      const item = items.find((f) => f.id === checkinId);
      if (!item) return null;
      setItems((prev) => prev.filter((f) => f.id !== checkinId));
      const { error } = await deleteCheckinPost(supabase, {
        id: item.id,
        postId: item.postId,
        photoPath: item.photoPath,
        userId,
      });
      router.refresh();
      return error;
    },
    [items, supabase, userId, router],
  );

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {items.map((c) => {
        const data: FeedItemData = {
          id: c.id,
          userId: c.userId,
          name: c.name,
          avatarUrl: c.avatarUrl,
          tier: c.tier,
          groupLabel: c.groupLabel ?? null,
          photoUrl: c.photoUrl,
          note: c.note,
          sport: c.sport,
          environment: c.environment,
          goal: c.goal,
          createdAt: c.createdAt,
        };
        return (
          <FeedItem
            key={c.id}
            item={data}
            reactions={reactionAgg[c.id] ?? {}}
            comments={commentsByCheckin[c.id] ?? []}
            currentUserId={userId}
            onToggleReaction={toggleReaction}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onDelete={deleteCheckin}
          />
        );
      })}
    </div>
  );
}
