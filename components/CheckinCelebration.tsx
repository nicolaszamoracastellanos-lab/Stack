"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";

/**
 * The check-in celebration — the final beat of Prove It, ported from
 * stack_v3_prototype.html §Celebration.
 *
 * Sequence: "STACKED." slams in (scale spring) → summary card rises → the
 * 120px extruded streak numeral ticks +1 with a spring pop at ~850ms → a
 * one-time volt particle burst (26 particles, Web Animations API). Actions:
 * share the story card (volt) or done (ghost). Reduced motion: everything
 * lands instantly, no particles, the final number just shows.
 */
export function CheckinCelebration({
  streakBefore,
  streakAfter,
  groupNames,
  weekLabel,
  consistencyPct,
  totalDays,
  onShare,
  shareBusy,
  onDone,
}: {
  streakBefore: number;
  streakAfter: number;
  groupNames: string[];
  weekLabel: string;
  consistencyPct: number;
  totalDays: number;
  onShare: () => void;
  shareBusy: boolean;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const numRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<HTMLDivElement | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // fires once, even through strict-mode remounts
    ran.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const num = numRef.current;

    if (reduced) {
      if (num) num.textContent = String(streakAfter);
      return;
    }

    // +1 tick with a spring pop, ~850ms in (prototype timing).
    const tick = window.setTimeout(() => {
      if (!num) return;
      if (streakAfter !== streakBefore) {
        num.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.18)" },
            { transform: "scale(1)" },
          ],
          { duration: 420, easing: "cubic-bezier(.3,1.6,.4,1)" },
        );
        num.textContent = String(streakAfter);
      }
    }, 850);

    // Volt particle burst — 26 particles, one shot (prototype `burst()`).
    const box = particlesRef.current;
    if (box) {
      for (let i = 0; i < 26; i++) {
        const pt = document.createElement("span");
        const ang = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 160;
        const x = Math.cos(ang) * dist;
        const y = Math.sin(ang) * dist - 60;
        const size = 4 + Math.random() * 5;
        pt.style.cssText = `position:absolute;left:50%;top:34%;width:${size}px;height:${size}px;border-radius:2px;background:#C6F806;opacity:0;pointer-events:none;`;
        pt.animate(
          [
            { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${180 + Math.random() * 360}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 900 + Math.random() * 500,
            delay: 350,
            easing: "cubic-bezier(.2,.8,.4,1)",
            fill: "forwards",
          },
        );
        box.appendChild(pt);
      }
    }
    return () => window.clearTimeout(tick);
  }, [streakBefore, streakAfter]);

  return (
    <div
      className="relative flex min-h-full flex-col items-center px-[26px] pb-10 pt-20 text-center"
      style={{
        background:
          "radial-gradient(100% 55% at 50% 0%, rgba(198,248,6,.09), transparent 60%)",
      }}
    >
      <div ref={particlesRef} aria-hidden className="absolute inset-0 z-[5] overflow-hidden" />

      <h1 className="cel-slam type-display text-[52px] leading-none tracking-[-0.03em]">
        {t("celebrate_title")}
        <span className="text-volt" style={{ textShadow: "0 0 30px rgba(198,248,6,.7)" }}>
          .
        </span>
      </h1>

      <p
        className="in-rise mt-2.5 text-[14px] font-semibold text-text-muted"
        style={{ animationDelay: ".5s" }}
      >
        {groupNames.length > 0
          ? t("celebrate_posted_to", { groups: groupNames.join(", ") })
          : t("celebrate_solo")}
      </p>

      <div className="cel-card-up depth mt-[30px] w-full rounded-card border border-border px-[22px] py-[26px]">
        <p className="eyebrow mb-2.5">{t("streak_label")}</p>
        <div
          ref={numRef}
          className="type-numeral streak-extrude-xl text-[120px] leading-[0.9] tracking-[-0.05em]"
        >
          {streakBefore}
        </div>
        <div className="mt-[26px] flex justify-between border-t border-border pt-5">
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <b className="nums text-[24px] font-black" style={{ fontStretch: "115%" }}>
              {weekLabel}
            </b>
            <span className="eyebrow">{t("celebrate_this_week")}</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <b className="nums text-[24px] font-black" style={{ fontStretch: "115%" }}>
              {consistencyPct}%
            </b>
            <span className="eyebrow">{t("celebrate_consistency")}</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <b className="nums text-[24px] font-black" style={{ fontStretch: "115%" }}>
              {totalDays}
            </b>
            <span className="eyebrow">{t("celebrate_total")}</span>
          </div>
        </div>
      </div>

      <div
        className="in-rise mt-auto flex w-full flex-col gap-3 pt-7"
        style={{ animationDelay: "1.4s" }}
      >
        <Button variant="primary" size="lg" fullWidth onClick={onShare} disabled={shareBusy}>
          {shareBusy ? t("card_generating") : t("celebrate_share")}
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onDone}>
          {t("celebrate_done")}
        </Button>
      </div>
    </div>
  );
}
