"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Fully rounded — for compact inline actions (nudge, send, chips). */
  pill?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn font-medium " +
  "transition duration-150 select-none disabled:opacity-40 " +
  "disabled:pointer-events-none active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/60 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  // Primary action — the soul color. Black text on volt for max contrast.
  primary: "bg-volt text-bg hover:bg-volt-dim active:bg-volt-dim",
  // Quiet, structural. Hairline border that strengthens on hover.
  secondary:
    "bg-transparent text-text border border-border-strong hover:bg-surface-2 active:bg-surface-2",
  // Destructive, but neutral: red belongs to the streak alone. The raised
  // surface + strong border + copy carry the weight of "this costs you".
  danger:
    "bg-surface-2 text-text border border-border-strong hover:border-text-dim active:bg-surface",
  // Lowest emphasis — text only.
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-2 active:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-label",
  md: "h-11 px-4 text-label",
  lg: "h-14 px-6 text-body",
};

/**
 * The one button in Stack. Variants carry the emotional weight: volt for
 * "do the thing", danger for destructive-but-neutral (red is reserved for the
 * at-risk streak), secondary/ghost for everything structural.
 *
 * `sm` (36px) is under the 44pt touch minimum — only use it where the
 * surrounding row provides the rest of the hit area.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", fullWidth, pill, className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          pill && "rounded-pill",
          className,
        )}
        {...props}
      />
    );
  },
);
