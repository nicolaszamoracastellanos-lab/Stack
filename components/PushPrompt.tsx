"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { subscribePush } from "@/lib/push/client";
import { detectPushCapability } from "@/lib/push/capability";

const DISMISS_KEY = "stack_push_prompt_dismissed";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * In-context permission prompt (Batch 5 D4). Asked at a GOOD moment — rendered
 * by the home screens only once the user has checked in today, never on cold
 * load. Shows only when push is supported and permission is still "default", and
 * never again once dismissed or granted. iOS-Safari-not-installed is excluded
 * (handled by the install flow + settings routing).
 */
export function PushPrompt({ userId }: { userId: string }) {
  const { t, lang } = useLanguage();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cap = detectPushCapability();
    if (!cap.supported || cap.permission !== "default") return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    setShow(true);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    const ok = await subscribePush(VAPID_PUBLIC_KEY);
    if (ok) {
      await createClient()
        .from("profiles")
        .update({ notif_master: true, language: lang })
        .eq("id", userId);
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="rounded-card border border-volt/30 bg-volt/10 p-4">
      <p className="text-label font-semibold text-text">{t("push_prompt_title")}</p>
      <p className="mt-1 text-caption text-text-muted">{t("push_prompt_body")}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" size="md" onClick={enable} disabled={busy}>
          {t("push_prompt_enable")}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          disabled={busy}
          className="rounded-pill px-3 py-1.5 text-caption text-text-dim hover:text-text"
        >
          {t("push_prompt_later")}
        </button>
      </div>
    </div>
  );
}
