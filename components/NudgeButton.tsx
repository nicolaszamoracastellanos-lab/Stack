"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { emitPush } from "@/lib/push/emit";
import { cn } from "@/lib/utils";

/**
 * One-tap nudge for an at-risk member (Batch 2 · Section 6). The DB enforces a
 * one-per-day rate limit (unique on from/to/day), so a duplicate just resolves
 * to the "Nudged" state rather than erroring loudly.
 */
export function NudgeButton({
  groupId,
  fromUserId,
  toUserId,
}: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
}) {
  const { t } = useLanguage();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function nudge() {
    if (state !== "idle") return;
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.from("nudges").insert({
      group_id: groupId,
      from_user: fromUserId,
      to_user: toUserId,
    });
    // 23505 = already nudged today; treat as success (still "Nudged").
    if (error && error.code !== "23505") {
      setState("idle");
      return;
    }
    // Push the nudge (Batch 5 D3 #6). Only on a fresh nudge, not a dup.
    if (!error) emitPush({ event: "nudge", targetUserId: toUserId });
    setState("done");
  }

  const done = state === "done";
  return (
    <button
      type="button"
      onClick={nudge}
      disabled={state !== "idle"}
      className={cn(
        "shrink-0 rounded-pill border px-2.5 py-1 text-caption font-medium transition-colors",
        done
          ? "border-border text-text-dim"
          : "border-volt/40 text-volt hover:bg-volt/10",
      )}
    >
      {done ? t("nudge_sent") : t("nudge_cta")}
    </button>
  );
}
