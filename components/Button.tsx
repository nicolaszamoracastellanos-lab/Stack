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
  "inline-flex items-center justify-center gap-2 rounded-btn " +
  "transition duration-150 select-none disabled:opacity-40 " +
  "disabled:pointer-events-none active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/60 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

// v3 recipes, verbatim from the prototype: the volt CTA is uppercase 800 with
// a permanent outer glow (it IS the screen's one glowing element); secondary
// is the ghost recipe — transparent, strong hairline, uppercase 700.
const variants: Record<Variant, string> = {
  primary:
    "bg-volt text-bg font-extrabold uppercase tracking-[0.01em] " +
    "hover:bg-volt-dim active:bg-volt-dim",
  secondary:
    "bg-transparent text-text font-bold uppercase tracking-[0.02em] " +
    "border border-border-strong hover:bg-surface-2 active:bg-surface-2",
  // Destructive, but neutral: red belongs to the streak alone. The raised
  // surface + strong border + copy carry the weight of "this costs you".
  danger:
    "bg-surface-2 text-text font-medium border border-border-strong hover:border-text-dim active:bg-surface",
  // Lowest emphasis — text only.
  ghost:
    "bg-transparent text-text-muted font-medium hover:text-text hover:bg-surface-2 active:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-label",
  md: "h-11 px-4 text-label",
  lg: "h-14 px-6 text-[16px]",
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
          // The glow ships with the big volt CTA only — small primaries (chat
          // send, inline actions) stay quiet so each screen keeps one glow.
          variant === "primary" && size === "lg" && "glow-volt",
          fullWidth && "w-full",
          pill && "rounded-pill",
          className,
        )}
        {...props}
      />
    );
  },
);
