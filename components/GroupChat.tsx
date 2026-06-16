"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { LeaderEntry } from "@/lib/groups-dashboard";

type Message = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

/**
 * Minimal real-time group chat (Batch 2 · Section 8). Same Supabase realtime
 * pattern as the feed. RLS restricts read/write to group members. Member
 * names/avatars come from the roster already loaded by the detail page.
 */
export function GroupChat({
  groupId,
  userId,
  members,
}: {
  groupId: string;
  userId: string;
  members: LeaderEntry[];
}) {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  const roster = useMemo(() => {
    const byId: Record<string, { name: string; avatarUrl: string | null }> = {};
    for (const m of members) byId[m.userId] = { name: m.name, avatarUrl: m.avatarUrl };
    return byId;
  }, [members]);

  useEffect(() => {
    setNow(Date.now());
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, user_id, body, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (active && data) setMessages(data as Message[]);
    })();

    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId]);

  // Keep the latest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await supabase
      .from("messages")
      .insert({ group_id: groupId, user_id: userId, body });
  }

  return (
    <div>
      <div className="max-h-96 overflow-y-auto rounded-card border border-border bg-surface p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-body text-text-dim">
            {t("chat_empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              const who = roster[m.user_id];
              const name = who?.name ?? "Member";
              return (
                <li key={m.id} className="flex items-start gap-2.5">
                  <Link href={`/u/${m.user_id}`} className="mt-0.5 shrink-0">
                    <Avatar name={name} src={who?.avatarUrl} size="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <Link
                        href={`/u/${m.user_id}`}
                        className="truncate text-label font-medium text-text"
                      >
                        {name}
                      </Link>
                      <time className="shrink-0 font-mono text-caption text-text-dim nums">
                        {now ? formatRelativeTime(m.created_at, now, t("time_now")) : ""}
                      </time>
                    </p>
                    <p className="whitespace-pre-wrap break-words text-body text-text-muted">
                      {m.body}
                    </p>
                  </div>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("chat_placeholder")}
          maxLength={1000}
          className="min-w-0 flex-1 rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-btn bg-volt px-4 py-2.5 text-label font-medium text-bg disabled:opacity-40"
        >
          {t("chat_send")}
        </button>
      </form>
    </div>
  );
}
