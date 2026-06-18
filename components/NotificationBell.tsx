"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Notification bell (STACK_BATCH6 1.4) for the Home top bar. Shows an unread
 * count badge (number up to 99+, dot hidden at 0). Live via the notifications
 * realtime channel; re-counts on focus (so it clears after the center marks
 * rows read).
 */
export function NotificationBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [unread, setUnread] = useState(initialUnread);

  const refetch = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null);
    setUnread(count ?? 0);
  }, [supabase, userId]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => setUnread((u) => u + 1),
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, refetch]);

  const label = unread > 99 ? "99+" : String(unread);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill text-text-muted hover:bg-surface hover:text-text"
      aria-label="Activity"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-pill border-2 border-bg bg-danger px-1 text-[10px] font-bold leading-none text-white">
          {label}
        </span>
      )}
    </Link>
  );
}
