"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";

/**
 * At-risk streak alert (Batch 5 C2). Red is reserved exclusively for this — no
 * tier uses it. Tapping reveals exactly what's needed to save the streak.
 */
export function AtRiskAlert() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="flex w-full items-start gap-3 rounded-card border border-danger/50 bg-danger/10 px-4 py-3 text-left"
    >
      <span aria-hidden className="mt-0.5 text-lg">🔴</span>
      <span className="min-w-0">
        <span className="block text-label font-semibold text-danger">
          {t("streak_atrisk_title")}
        </span>
        {open ? (
          <span className="mt-1 block text-caption text-text-muted">
            {t("streak_atrisk_explain")}
          </span>
        ) : (
          <span className="mt-0.5 block text-caption text-text-dim underline-offset-2">
            {t("streak_atrisk_dismiss")} →
          </span>
        )}
      </span>
    </button>
  );
}
