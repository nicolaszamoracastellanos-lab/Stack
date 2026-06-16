"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SharePhotoButton } from "@/components/SharePhotoButton";
import { useLanguage } from "@/lib/language-context";
import { cn, formatRelativeTime } from "@/lib/utils";
import { SPORTS, GOALS, labelFor, iconFor } from "@/lib/workout-options";
import { REACTION_EMOJIS, type ReactionAgg } from "@/lib/reactions";
import type { FeedComment } from "@/lib/feed";

export type FeedItemData = {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  photoUrl: string;
  note?: string | null;
  sport?: string | null;
  environment?: string | null;
  goal?: string | null;
  createdAt: string;
};

type FeedItemProps = {
  item: FeedItemData;
  isNew?: boolean;
  reactions: ReactionAgg;
  comments: FeedComment[];
  currentUserId: string;
  onToggleReaction: (checkinId: string, emoji: string) => void;
  onAddComment: (checkinId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
};

/**
 * A workout post card: who, the proof photo, the sport + meta tags, the notes,
 * a row of emoji reactions (count + who, tap to toggle), and a lightweight
 * comment thread (Batch 2 · Section 5). Reactions and comments update in real
 * time from HomeClient's subscriptions.
 */
export function FeedItem({
  item,
  isNew,
  reactions,
  comments,
  currentUserId,
  onToggleReaction,
  onAddComment,
  onDeleteComment,
}: FeedItemProps) {
  const { t, lang } = useLanguage();
  const [draft, setDraft] = useState("");

  const [now, setNow] = useState<number>(() => new Date(item.createdAt).getTime());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const time = formatRelativeTime(item.createdAt, now, t("time_now"));
  const envLabel = item.environment
    ? t(item.environment === "indoor" ? "env_indoor" : "env_outdoor")
    : null;

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onAddComment(item.id, body);
    setDraft("");
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        isNew && "animate-slide-fade-in",
      )}
    >
      <header className="flex items-center gap-3 p-4">
        <Link href={`/u/${item.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={item.name} src={item.avatarUrl} size="md" />
          <p className="truncate text-body font-medium text-text">{item.name}</p>
        </Link>
        <time className="font-mono text-caption text-text-dim nums">{time}</time>
      </header>

      <div className="relative aspect-[9/16] w-full bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed storage urls */}
        <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
        <SharePhotoButton src={item.photoUrl} className="absolute bottom-3 right-3" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Sport + meta tags */}
        {(item.sport || envLabel || item.goal) && (
          <div className="flex flex-wrap items-center gap-2">
            {item.sport && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-3 py-1.5 text-label font-semibold text-text">
                <span aria-hidden>{iconFor(SPORTS, item.sport)}</span>
                {labelFor(SPORTS, item.sport, lang)}
              </span>
            )}
            {envLabel && (
              <span className="rounded-pill border border-border bg-bg px-2.5 py-1 text-caption text-text-muted">
                {envLabel}
              </span>
            )}
            {item.goal && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-volt/30 bg-volt/10 px-2.5 py-1 text-caption font-medium text-volt">
                <span aria-hidden>{iconFor(GOALS, item.goal)}</span>
                {labelFor(GOALS, item.goal, lang)}
              </span>
            )}
          </div>
        )}

        {item.note && (
          <p className="whitespace-pre-wrap text-body text-text-muted">{item.note}</p>
        )}

        {/* Reactions */}
        <div className="flex flex-wrap gap-2">
          {REACTION_EMOJIS.map((emoji) => {
            const agg = reactions[emoji];
            const count = agg?.count ?? 0;
            const mine = agg?.mine ?? false;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(item.id, emoji)}
                aria-pressed={mine}
                title={agg?.who.join(", ")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-label transition-colors duration-150",
                  mine
                    ? "border-volt/40 bg-volt/10 text-volt"
                    : "border-border text-text-muted hover:border-border-strong hover:text-text",
                )}
              >
                <span aria-hidden className="text-base leading-none">{emoji}</span>
                {count > 0 && <span className="font-mono nums">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <ul className="flex flex-col gap-2 border-t border-border pt-3">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <Link href={`/u/${c.user_id}`} className="mt-0.5 shrink-0">
                  <Avatar name={c.name} src={c.avatarUrl} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-body text-text">
                    <Link href={`/u/${c.user_id}`} className="font-medium">
                      {c.name}
                    </Link>{" "}
                    <span className="text-text-muted">{c.body}</span>
                  </p>
                </div>
                {c.user_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(c.id)}
                    className="shrink-0 text-caption text-text-dim hover:text-danger"
                  >
                    {t("feed_comment_delete")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submitComment} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("feed_comment_placeholder")}
            maxLength={300}
            className="min-w-0 flex-1 rounded-input border border-border bg-surface-2 px-3 py-2 text-label text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-btn px-3 py-2 text-label font-medium text-volt disabled:opacity-40"
          >
            {t("feed_comment_send")}
          </button>
        </form>
      </div>
    </article>
  );
}
