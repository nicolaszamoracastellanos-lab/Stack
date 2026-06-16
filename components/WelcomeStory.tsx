"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Screen = {
  /** Screen 1 shows the wordmark instead of a headline. */
  wordmark?: boolean;
  titleKey?: TranslationKey;
  subKey: TranslationKey;
};

const SCREENS: Screen[] = [
  { wordmark: true, subKey: "landing_tagline" },
  { titleKey: "ws2_title", subKey: "ws2_sub" },
  { titleKey: "ws3_title", subKey: "ws3_sub" },
  { titleKey: "ws4_title", subKey: "ws4_sub" },
  { titleKey: "ws5_title", subKey: "ws5_sub" },
];

const SWIPE_THRESHOLD = 48; // px to count as a page change

/**
 * The Welcome Story (Part 1): a short, full-screen, swipeable brand intro shown
 * once after signup, before profile setup. One idea per screen, big type, dark +
 * volt. Motion mirrors the splash — headline fades and rises, the sub follows
 * ~150ms later. `onComplete` fires on the final CTA or Skip (the trigger logic
 * persists the flag and routes onward).
 */
export function WelcomeStory({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const last = SCREENS.length - 1;

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(last, i)));
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    if (drag <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (drag >= SWIPE_THRESHOLD) goTo(index - 1);
    startX.current = null;
    setDrag(0);
  }

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-bg">
      {/* Subtle volt glow, brand-forward. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-volt/[0.07] blur-[120px]"
      />

      {/* Skip */}
      <div className="relative z-10 flex justify-end px-6 pt-6">
        <button
          type="button"
          onClick={onComplete}
          className="text-label text-text-dim hover:text-text"
        >
          {t("welcome_skip")}
        </button>
      </div>

      {/* Paged track */}
      <div
        className="relative flex-1 touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
            transition: startX.current === null ? "transform 350ms ease-out" : "none",
          }}
        >
          {SCREENS.map((screen, i) => {
            const active = i === index;
            return (
              <section
                key={i}
                className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center"
              >
                <div className="w-full max-w-md">
                  {screen.wordmark ? (
                    <div
                      className={cn(
                        "transition-all duration-[400ms] ease-out motion-reduce:transition-opacity",
                        active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                      )}
                    >
                      <Wordmark size="lg" style={{ fontSize: "clamp(3rem, 13vw, 4.5rem)" }} />
                    </div>
                  ) : (
                    <h1
                      className={cn(
                        "text-balance text-[clamp(1.9rem,7vw,2.75rem)] font-bold leading-tight tracking-tight text-text",
                        "transition-all duration-[400ms] ease-out motion-reduce:transition-opacity",
                        active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                      )}
                    >
                      {t(screen.titleKey!)}
                    </h1>
                  )}
                  <p
                    className={cn(
                      "mt-5 text-balance text-body text-text-muted",
                      screen.wordmark && "text-h2 font-semibold text-text-muted",
                      "transition-all duration-[400ms] ease-out [transition-delay:150ms] motion-reduce:transition-opacity",
                      active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                    )}
                  >
                    {t(screen.subKey)}
                  </p>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Dots + advance */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 pb-10">
        <div className="flex items-center gap-2">
          {SCREENS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-pill transition-all duration-200",
                i === index ? "w-6 bg-volt" : "w-2 bg-border-strong",
              )}
            />
          ))}
        </div>

        {index === last ? (
          <Button variant="primary" size="lg" fullWidth className="max-w-sm" onClick={onComplete}>
            {t("ws5_cta")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="max-w-sm"
            onClick={() => goTo(index + 1)}
          >
            {t("welcome_continue")}
          </Button>
        )}
      </div>
    </main>
  );
}
