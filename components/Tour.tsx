"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { TOUR_STEPS } from "@/lib/tour-steps";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // spotlight padding around the target
const TIP_W = 320; // tooltip width target

/**
 * Custom spotlight tour overlay (Part 2). Dims the screen, cuts out one real UI
 * element at a time (located via its `data-tour` attribute), and shows a
 * tooltip with title, copy, a step counter, Next, and Skip. Chosen over
 * react-joyride for full brand control, no extra dependency, and no App-Router
 * SSR quirks. `onComplete` fires on finish or skip (trigger logic persists the
 * flag). The final step routes into the check-in flow — ending on the core
 * action.
 */
export function Tour({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null); // graceful: explanation without spotlight
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  // Bring the target into view, then measure (after layout settles).
  useLayoutEffect(() => {
    if (step.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      el?.scrollIntoView({ block: "center", behavior: "auto" });
    }
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [measure, step.target]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  function next() {
    if (isLast) {
      onComplete();
      router.push("/checkin");
      return;
    }
    setIndex((i) => i + 1);
  }

  // Tooltip placement: below the target if there's room, else above; centered
  // when there's no target.
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const vh = typeof window !== "undefined" ? window.innerHeight : 640;
  const w = Math.min(TIP_W, vw - 32);

  let tipStyle: React.CSSProperties;
  if (rect) {
    const placeBelow = rect.top + rect.height < vh * 0.6;
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 16));
    tipStyle = placeBelow
      ? { top: rect.top + rect.height + PAD + 12, left, width: w }
      : { bottom: vh - rect.top + PAD + 12, left, width: w };
  } else {
    tipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: w };
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Click-blocker: keeps the app uninteractive while the tour drives. */}
      <div
        className="absolute inset-0"
        style={{ background: rect ? "transparent" : "rgba(10,10,11,0.82)" }}
      />

      {/* Spotlight cut-out (the huge box-shadow dims everything around it). */}
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-volt"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(10,10,11,0.82)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute animate-slide-fade-in rounded-card border border-border bg-surface-2 p-4 shadow-lg"
        style={tipStyle}
      >
        <p className="text-h2 text-text">{t(step.titleKey)}</p>
        <p className="mt-1.5 text-label text-text-muted">{t(step.bodyKey)}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-caption text-text-dim nums">
            {index + 1} / {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onComplete}
              className="text-label text-text-dim hover:text-text"
            >
              {t("tour_skip")}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-btn bg-volt px-4 py-2 text-label font-medium text-bg hover:bg-volt-dim"
            >
              {isLast ? t("tour_finish") : t("tour_next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
