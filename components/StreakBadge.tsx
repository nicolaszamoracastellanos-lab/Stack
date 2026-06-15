import { cn } from "@/lib/utils";

export type StreakState = "alive" | "at-risk" | "broken";

type StreakBadgeProps = {
  count: number;
  label: string;
  state: StreakState;
  /** "display" is the hero number on home; "md" is compact (group streak, etc.) */
  size?: "display" | "md";
  className?: string;
};

// Flame icon. We keep it inline so its color is driven by `currentColor`,
// which means the state color flows straight through from the text class.
function Flame({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2c.5 3-1.8 4.2-3 6-1.4 2-1 4 0 5 .3-1 1-2 2-2.5-.3 1.6.4 2.6 1.3 3.4.9.8 1.4 1.8 1.2 3 .8-.4 1.6-1.2 2-2.3.7 1 .9 2 .6 3.2 2-1.3 3.1-3.4 3.1-5.8 0-3.2-2-5.6-3.6-7 .1 1.4-.6 2.4-1.6 2.8.6-2.4-.4-4.7-2-6z" />
    </svg>
  );
}

const colorByState: Record<StreakState, string> = {
  alive: "text-volt",
  // At risk: streak still alive, so the number stays volt — the danger cue is
  // surfaced as a separate prompt by the caller (see home screen).
  "at-risk": "text-volt",
  broken: "text-danger",
};

/**
 * The streak number with a flame, color-driven by state. This is the thing the
 * user protects, so it is loud and unmissable on the home screen.
 */
export function StreakBadge({
  count,
  label,
  state,
  size = "display",
  className,
}: StreakBadgeProps) {
  const color = colorByState[state];
  const isDisplay = size === "display";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Flame
        className={cn(color, isDisplay ? "h-12 w-12" : "h-5 w-5")}
      />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-mono nums tabular-nums",
            color,
            isDisplay ? "text-display" : "text-h2 font-bold",
          )}
        >
          {count}
        </span>
        <span
          className={cn(
            "text-text-muted",
            isDisplay ? "text-label mt-1" : "text-caption",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
