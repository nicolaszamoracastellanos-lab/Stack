"use client";

import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

/**
 * The Stack wordmark — live type so it stays crisp at any size.
 *
 * "Stack" in Geist 800, white, tight tracking, with the period rendered as a
 * small VOLT SQUARE (not a round dot) sitting on the baseline after the "k".
 * That volt square is the same accent as the icon summit and the splash — the
 * brand signature. See STACK_BRANDING.md §4.
 *
 * The square is sized in `em`, so it tracks the font size automatically at every
 * `size` (and any custom `style.fontSize` an override passes in). It is
 * `aria-hidden` — the accessible name stays the plain word "Stack".
 *
 * PHASE 2 (living wordmark): the period could pulse/dim with streak state, the
 * same volt-summit idea as the app icon. Not built now.
 */
const FONT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "1.25rem", // 20px — inline / compact lockups
  md: "1.5rem", //  24px — app & auth headers (matches text-h2)
  lg: "2.5rem", //  40px — large lockups; splash/hero pass their own fontSize
};

export function Wordmark({
  size = "md",
  showPeriod = true,
  className,
  style,
}: {
  size?: "sm" | "md" | "lg";
  showPeriod?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useLanguage();

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-extrabold leading-none tracking-[-0.02em] text-text",
        className,
      )}
      // FONT_SIZE first so a caller's style.fontSize (splash/hero) wins.
      style={{ fontSize: FONT_SIZE[size], ...style }}
    >
      {t("brand")}
      {showPeriod && (
        <span
          aria-hidden
          className="ml-[0.04em] inline-block rounded-[18%] bg-volt"
          style={{ width: "0.16em", height: "0.16em" }}
        />
      )}
    </span>
  );
}
