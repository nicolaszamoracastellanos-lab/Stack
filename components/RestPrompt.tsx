"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { dayKey, weekdayMon0, addDaysKey } from "@/lib/week";

const SESSION_KEY = "stack_rest_prompt_seen";

/**
 * Smart return prompt (Batch 5 C3). If the user didn't log on their preferred
 * rest day(s) in the last couple of days, ask "Were those your rest days?".
 * Purely informational — it never changes the streak math (quota is the only
 * source of truth). "Yes" records them as rest days so the heatmap reflects the
 * intent; "No" just dismisses. Shown at most once per session.
 */
export function RestPrompt({
  userId,
  preferredRestDays,
  loggedDayKeys,
}: {
  userId: string;
  preferredRestDays: number[];
  loggedDayKeys: string[];
}) {
  const { t, lang } = useLanguage();

  const missed = useMemo(() => {
    if (!preferredRestDays.length) return [];
    const restSet = new Set(preferredRestDays);
    const logged = new Set(loggedDayKeys.map((d) => dayKey(new Date(d))));
    const todayKey = dayKey(new Date());
    const out: string[] = [];
    // Look back over the last two completed days.
    for (let i = 1; i <= 2; i++) {
      const k = addDaysKey(todayKey, -i);
      if (restSet.has(weekdayMon0(k)) && !logged.has(k)) out.push(k);
    }
    return out;
  }, [preferredRestDays, loggedDayKeys]);

  const alreadySeen = useMemo(() => {
    try {
      return !!sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  }, []);

  const [dismissed, setDismissed] = useState(false);
  if (missed.length === 0 || alreadySeen || dismissed) return null;

  const dayNames = missed
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(lang, { weekday: "short" });
    })
    .join(" / ");

  function close() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  async function yes() {
    // Record as rest days (cosmetic — heatmap only). Best-effort.
    const rows = missed.map((day) => ({ user_id: userId, day }));
    await createClient().from("rest_days").upsert(rows, { onConflict: "user_id,day" });
    close();
  }

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <p className="text-label text-text">
        {t("rest_prompt_q", { days: dayNames })}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={yes}
          className="rounded-pill border border-volt bg-volt/15 px-3 py-1.5 text-caption font-medium text-volt"
        >
          {t("rest_prompt_yes")}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-pill border border-border px-3 py-1.5 text-caption text-text-muted hover:text-text"
        >
          {t("rest_prompt_no")}
        </button>
      </div>
    </div>
  );
}
