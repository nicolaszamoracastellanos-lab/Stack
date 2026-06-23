"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";

/**
 * Penalty (stake) feature announcement. Two surfaces, one shared explanation:
 *
 *  - <PenaltyPopup>  — a modal shown right after a group is created, in the
 *    same "here's how it works" spirit as the install/add-to-home guide.
 *  - <PenaltyNudge>  — a dismissible in-context card shown on a group that has
 *    a challenge but no penalty yet, inviting the creator to add one.
 *
 * Both link the creator into the pact editor where the stake actually lives.
 */

const POINTS = [
  { icon: "💸", titleKey: "penalty_point1_title", bodyKey: "penalty_point1_body" },
  { icon: "⚖️", titleKey: "penalty_point2_title", bodyKey: "penalty_point2_body" },
  { icon: "🔥", titleKey: "penalty_point3_title", bodyKey: "penalty_point3_body" },
] as const;

function PenaltyPoints() {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col gap-4">
      {POINTS.map((p) => (
        <li key={p.titleKey} className="flex items-start gap-3">
          <span aria-hidden className="text-xl leading-none">
            {p.icon}
          </span>
          <div className="min-w-0">
            <p className="text-label font-semibold text-text">{t(p.titleKey)}</p>
            <p className="mt-0.5 text-label text-text-muted">{t(p.bodyKey)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Modal announcement — shown once after creating a group. */
export function PenaltyPopup({ groupId }: { groupId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md animate-slide-fade-in rounded-card border border-volt/30 bg-surface p-6 shadow-lg"
      >
        <p className="text-caption font-medium uppercase tracking-wide text-volt">
          {t("penalty_intro_eyebrow")}
        </p>
        <h2 className="mt-1 text-balance text-h1">{t("penalty_intro_title")}</h2>
        <p className="mt-2 text-balance text-body text-text-muted">
          {t("penalty_intro_lead")}
        </p>

        <div className="mt-6">
          <PenaltyPoints />
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <Link href={`/groups/${groupId}/pact`}>
            <Button variant="primary" size="lg" fullWidth>
              {t("penalty_intro_cta")}
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="py-1 text-label text-text-dim hover:text-text"
          >
            {t("penalty_intro_later")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * In-context nudge for an existing group whose challenge has no penalty.
 * Dismissal is remembered per-group in localStorage so it doesn't nag.
 */
export function PenaltyNudge({ groupId }: { groupId: string }) {
  const { t } = useLanguage();
  const key = `stack_penalty_nudge_dismissed_${groupId}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [key]);

  function dismiss() {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="rounded-card border border-volt/30 bg-volt/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-volt">
            {t("penalty_intro_eyebrow")}
          </p>
          <p className="mt-1 text-label font-semibold text-text">
            {t("penalty_nudge_title")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("penalty_nudge_dismiss")}
          className="shrink-0 rounded-pill px-2 py-1 text-text-dim hover:text-text"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 text-label text-text-muted">{t("penalty_nudge_body")}</p>
      <Link href={`/groups/${groupId}/pact`} className="mt-4 block">
        <Button variant="primary" size="md" fullWidth>
          {t("penalty_nudge_cta")}
        </Button>
      </Link>
    </div>
  );
}
