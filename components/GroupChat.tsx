"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { MentionInput } from "@/components/MentionInput";
import { MentionText } from "@/components/MentionText";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { markChatRead } from "@/lib/chat";
import { emitPush } from "@/lib/push/emit";
import { extractMentionUserIds, type MentionMember } from "@/lib/mentions";
import { localDateKey } from "@/lib/streaks";
import type { LeaderEntry } from "@/lib/groups-dashboard";
import type { TierKey } from "@/lib/tiers";

const PAGE = 30;

type Message = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  _status?: "sending" | "failed";
};

/**
 * Group chat (STACK_BATCH6 Stage 3): bubbles (own right, others left with
 * avatar + name + tier), day separators + timestamps, input pinned to the
 * bottom, auto-scroll, realtime, optimistic send with a failed/retry state, and
 * scroll-up pagination. Marks the chat read on open.
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
  const { t, lang } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);

  const roster = useMemo(() => {
    const byId: Record<string, { name: string; avatarUrl: string | null; tier: TierKey | null }> = {};
    for (const m of members) byId[m.userId] = { name: m.name, avatarUrl: m.avatarUrl, tier: m.tier };
    return byId;
  }, [members]);

  // Initial load + realtime + mark read.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, user_id, body, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (!active) return;
      const rows = ((data ?? []) as Message[]).reverse();
      setMessages(rows);
      setHasMore((data?.length ?? 0) >= PAGE);
      requestAnimationFrame(() => endRef.current?.scrollIntoView());
    })();
    markChatRead(groupId);

    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.user_id !== userId) markChatRead(groupId);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId, userId]);

  // Auto-scroll to newest unless the user has scrolled up.
  useEffect(() => {
    if (atBottomRef.current) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (el.scrollTop < 60 && hasMore && !loadingOlder) loadOlder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingOlder]);

  async function loadOlder() {
    const oldest = messages[0]?.created_at;
    if (!oldest) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const { data } = await supabase
      .from("messages")
      .select("id, user_id, body, created_at")
      .eq("group_id", groupId)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const older = ((data ?? []) as Message[]).reverse();
    setHasMore((data?.length ?? 0) >= PAGE);
    setMessages((prev) => [...older, ...prev]);
    setLoadingOlder(false);
    // Preserve scroll position after prepending.
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  }

  const mentionMembers: MentionMember[] = useMemo(
    () => members.map((m) => ({ id: m.userId, name: m.name, avatarUrl: m.avatarUrl })),
    [members],
  );

  async function doSend(body: string, localId: string) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ group_id: groupId, user_id: userId, body })
      .select("id, user_id, body, created_at")
      .single();
    if (error || !data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === localId ? { ...m, _status: "failed" } : m)),
      );
      return;
    }
    // Notify mentioned members (group-scoped + validated server-side).
    const ids = extractMentionUserIds(body);
    if (ids.length > 0) {
      emitPush({
        event: "mention",
        userIds: ids,
        groupId,
        snippet: body,
        targetType: "chat_message",
        targetId: (data as Message).id,
      });
    }
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === (data as Message).id);
      const withoutLocal = prev.filter((m) => m.id !== localId);
      return exists ? withoutLocal : [...withoutLocal, data as Message];
    });
  }

  function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const localId = crypto.randomUUID();
    atBottomRef.current = true;
    setMessages((prev) => [
      ...prev,
      { id: localId, user_id: userId, body, created_at: new Date().toISOString(), _status: "sending" },
    ]);
    doSend(body, localId);
  }

  function retry(m: Message) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, _status: "sending" } : x)));
    doSend(m.body, m.id);
  }

  return (
    <div className="flex flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex max-h-[28rem] min-h-[12rem] flex-col gap-1 overflow-y-auto rounded-card border border-border bg-surface p-4"
      >
        {hasMore && (
          <button
            type="button"
            onClick={loadOlder}
            disabled={loadingOlder}
            className="mx-auto mb-2 text-caption text-text-dim hover:text-text"
          >
            {loadingOlder ? t("loading") : t("chat_load_earlier")}
          </button>
        )}
        {messages.length === 0 ? (
          <p className="py-8 text-center text-body text-text-dim">{t("chat_empty")}</p>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay =
              !prev || localDateKey(new Date(prev.created_at)) !== localDateKey(new Date(m.created_at));
            const mine = m.user_id === userId;
            const who = roster[m.user_id];
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-2 flex items-center justify-center">
                    <span className="rounded-pill bg-bg px-3 py-0.5 text-caption text-text-dim">
                      {new Date(m.created_at).toLocaleDateString(lang, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <Bubble mine={mine} m={m} who={who} lang={lang} onRetry={() => retry(m)} retryLabel={t("chat_retry")} failedLabel={t("chat_failed")} />
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <MentionInput
          value={draft}
          onChange={setDraft}
          members={mentionMembers}
          placeholder={t("chat_placeholder")}
          onSubmit={() => send()}
          className="min-h-[2.75rem] w-full resize-none rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
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

function Bubble({
  mine,
  m,
  who,
  lang,
  onRetry,
  retryLabel,
  failedLabel,
}: {
  mine: boolean;
  m: Message;
  who?: { name: string; avatarUrl: string | null; tier: TierKey | null };
  lang: string;
  onRetry: () => void;
  retryLabel: string;
  failedLabel: string;
}) {
  const time = new Date(m.created_at).toLocaleTimeString(lang, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (mine) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[80%] rounded-card rounded-br-sm border border-volt/30 bg-volt/15 px-3 py-2">
          <p className="whitespace-pre-wrap break-words text-body text-text">
            <MentionText body={m.body} />
          </p>
        </div>
        <span className="mt-0.5 flex items-center gap-2 text-caption text-text-dim">
          {m._status === "sending" ? "…" : m._status === "failed" ? (
            <button type="button" onClick={onRetry} className="text-danger underline-offset-2 hover:underline">
              {failedLabel} · {retryLabel}
            </button>
          ) : (
            time
          )}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <Link href={`/u/${m.user_id}`} className="mt-4 shrink-0">
        <Avatar name={who?.name ?? "Member"} src={who?.avatarUrl ?? null} size="sm" />
      </Link>
      <div className="min-w-0 max-w-[80%]">
        <div className="mb-0.5 flex items-center gap-2">
          <Link href={`/u/${m.user_id}`} className="truncate text-caption font-medium text-text">
            {who?.name ?? "Member"}
          </Link>
          {who?.tier && <TierBadge tierKey={who.tier} size="sm" />}
        </div>
        <div className="rounded-card rounded-tl-sm border border-border bg-bg px-3 py-2">
          <p className="whitespace-pre-wrap break-words text-body text-text-muted">
            <MentionText body={m.body} />
          </p>
        </div>
        <span className="mt-0.5 block text-caption text-text-dim">{time}</span>
      </div>
    </div>
  );
}
