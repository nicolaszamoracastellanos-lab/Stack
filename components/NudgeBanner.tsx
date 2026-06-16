"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { setActiveGroup } from "@/lib/active-group";

type NudgeRow = {
  group_id: string;
  from_user: string;
  profile: { username: string; display_name: string | null } | null;
};

/**
 * In-app nudge notification (Fix #2). Shows when you have UNREAD nudges
 * (read_at is null). Tapping it converts the nudge: it marks the nudges read,
 * makes the nudging group active, and drops you into the check-in flow so
 * "take your photo now" is the obvious next step. The X dismisses (also marks
 * read). Read state is persisted in the DB, so a handled nudge never reappears;
 * a new nudge on a later day is a new row and surfaces again.
 */
export function NudgeBanner({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [who, setWho] = useState<string | null>(null);
  const [extra, setExtra] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("nudges")
        .select(
          "group_id, from_user, profile:profiles!nudges_from_user_fkey(username, display_name)",
        )
        .eq("to_user", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false });
      if (!active || error || !data || data.length === 0) return;
      const rows = data as unknown as NudgeRow[];
      const seen = new Set<string>();
      const senders: NudgeRow[] = [];
      for (const r of rows) {
        if (seen.has(r.from_user)) continue;
        seen.add(r.from_user);
        senders.push(r);
      }
      const first = senders[0];
      setWho(
        first.profile?.display_name?.trim() ||
          (first.profile ? `@${first.profile.username}` : "Someone"),
      );
      setExtra(senders.length - 1);
      setGroupId(rows[0].group_id);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  async function markRead() {
    setGone(true);
    const supabase = createClient();
    await supabase
      .from("nudges")
      .update({ read_at: new Date().toISOString() })
      .eq("to_user", userId)
      .is("read_at", null);
  }

  async function act() {
    await markRead();
    if (groupId) setActiveGroup(groupId);
    router.push("/checkin");
  }

  if (!who || gone) return null;
  const label = extra > 0 ? `${who} +${extra}` : who;

  return (
    <div className="flex w-full items-center gap-2 rounded-card border border-volt/40 bg-volt/10 pl-4 pr-2">
      <button
        type="button"
        onClick={act}
        className="min-w-0 flex-1 py-3 text-left text-label text-text"
      >
        {t("nudge_banner", { who: label })}
      </button>
      <button
        type="button"
        onClick={markRead}
        aria-label={t("nudge_dismiss")}
        className="shrink-0 rounded-pill px-2 py-1 text-text-dim hover:text-text"
      >
        ✕
      </button>
    </div>
  );
}
