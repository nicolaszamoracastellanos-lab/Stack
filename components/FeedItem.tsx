"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useLanguage } from "@/lib/language-context";
import { cn, formatRelativeTime } from "@/lib/utils";

export type FeedItemData = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  photoUrl: string;
  note?: string | null;
  createdAt: string;
  reactionCount: number;
  /** Whether the current viewer has reacted. */
  reacted: boolean;
};

type FeedItemProps = {
  item: FeedItemData;
  /** Animate in (used when a new check-in arrives over realtime). */
  isNew?: boolean;
  onToggleReaction?: (id: string) => void;
};

/**
 * A single check-in card: who, their proof photo, an optional note, when, and
 * the fire reaction. New items slide-and-fade in from the top.
 */
export function FeedItem({ item, isNew, onToggleReaction }: FeedItemProps) {
  const { t } = useLanguage();

  // Relative time is computed client-side against the device clock. We refresh
  // it on a slow interval so "5m" eventually becomes "6m" without a reload.
  const [now, setNow] = useState<number>(() => new Date(item.createdAt).getTime());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const time = formatRelativeTime(item.createdAt, now, t("time_now"));

  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        isNew && "animate-slide-fade-in",
      )}
    >
      <header className="flex items-center gap-3 p-4">
        <Avatar name={item.name} src={item.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-text">{item.name}</p>
        </div>
        <time className="font-mono text-caption text-text-dim nums">{time}</time>
      </header>

      {/* The proof. Square crop keeps the feed rhythmic. */}
      <div className="aspect-square w-full bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed/remote storage urls */}
        <img
          src={item.photoUrl}
          alt={t("nav_checkin")}
          className="h-full w-full object-cover"
        />
      </div>

      <footer className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => onToggleReaction?.(item.id)}
          aria-pressed={item.reacted}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-label transition-colors duration-150",
            item.reacted
              ? "border-volt/40 bg-volt/10 text-volt"
              : "border-border text-text-muted hover:border-border-strong hover:text-text",
          )}
        >
          <span aria-hidden className="text-base leading-none">🔥</span>
          {item.reactionCount > 0 && (
            <span className="font-mono nums">{item.reactionCount}</span>
          )}
        </button>
        {item.note && (
          <p className="min-w-0 flex-1 truncate text-body text-text-muted">
            {item.note}
          </p>
        )}
      </footer>
    </article>
  );
}
