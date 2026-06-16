"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

type NudgeRow = {
  from_user: string;
  profile: { username: string; display_name: string | null } | null;
};

/**
 * In-app nudge notification (Batch 2 · Section 6). Shows a friendly banner at
 * the top of Home when other members have nudged you today. Dismissible.
 * (Push notifications are a later phase — // PHASE 3.)
 */
export function NudgeBanner({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [who, setWho] = useState<string | null>(null);
  const [extra, setExtra] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("nudges")
        .select(
          "from_user, profile:profiles!nudges_from_user_fkey(username, display_name)",
        )
        .eq("to_user", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (!active || error || !data || data.length === 0) return;
      const rows = data as unknown as NudgeRow[];
      // Distinct senders.
      const seen = new Set<string>();
      const senders: NudgeRow[] = [];
      for (const r of rows) {
        if (seen.has(r.from_user)) continue;
        seen.add(r.from_user);
        senders.push(r);
      }
      const first = senders[0];
      const name =
        first.profile?.display_name?.trim() ||
        (first.profile ? `@${first.profile.username}` : "Someone");
      setWho(name);
      setExtra(senders.length - 1);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (!who || dismissed) return null;
  const label = extra > 0 ? `${who} +${extra}` : who;

  return (
    <button
      type="button"
      onClick={() => setDismissed(true)}
      className="flex w-full items-center gap-3 rounded-card border border-volt/40 bg-volt/10 px-4 py-3 text-left"
    >
      <span className="min-w-0 flex-1 text-label text-text">
        {t("nudge_banner", { who: label })}
      </span>
      <span aria-hidden className="shrink-0 text-text-dim">
        ✕
      </span>
    </button>
  );
}
