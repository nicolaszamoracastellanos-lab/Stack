"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SharePhotoButton } from "@/components/SharePhotoButton";
import { useLanguage } from "@/lib/language-context";
import { cn, formatRelativeTime } from "@/lib/utils";
import { SPORTS, GOALS, labelFor, iconFor } from "@/lib/workout-options";

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
  reactionCount: number;
  reacted: boolean;
};

type FeedItemProps = {
  item: FeedItemData;
  isNew?: boolean;
  onToggleReaction?: (id: string) => void;
};

/**
 * A workout post card: who, the proof photo, the sport as a prominent tag, the
 * environment + focus as volt pills, the notes, and a fire reaction.
 */
export function FeedItem({ item, isNew, onToggleReaction }: FeedItemProps) {
  const { t, lang } = useLanguage();

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

  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        isNew && "animate-slide-fade-in",
      )}
    >
      <header className="flex items-center gap-3 p-4">
        <Link
          href={`/u/${item.userId}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-pill"
        >
          <Avatar name={item.name} src={item.avatarUrl} size="md" />
          <p className="truncate text-body font-medium text-text">{item.name}</p>
        </Link>
        <time className="font-mono text-caption text-text-dim nums">{time}</time>
      </header>

      <div className="relative aspect-square w-full bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed storage urls */}
        <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
        <SharePhotoButton
          src={item.photoUrl}
          className="absolute bottom-3 right-3"
        />
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

        {/* Reaction */}
        <div>
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
        </div>
      </div>
    </article>
  );
}
