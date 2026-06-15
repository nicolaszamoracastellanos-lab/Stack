"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn font-medium " +
  "transition-colors duration-150 select-none disabled:opacity-40 " +
  "disabled:pointer-events-none focus-visible:outline-none";

const variants: Record<Variant, string> = {
  // Primary action — the soul color. Black text on volt for max contrast.
  primary:
    "bg-volt text-bg hover:bg-volt-dim active:bg-volt-dim",
  // Quiet, structural. Hairline border that strengthens on hover.
  secondary:
    "bg-transparent text-text border border-border-strong hover:bg-surface-2 hover:border-border-strong",
  // Destructive / streak-broken energy.
  danger: "bg-danger text-bg hover:bg-danger-dim active:bg-danger-dim",
  // Lowest emphasis — text only.
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-label",
  lg: "h-14 px-6 text-body",
};

/**
 * The one button in Stack. Variants carry the emotional weight: volt for
 * "do the thing", danger for "this costs you", secondary/ghost for everything
 * structural.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", fullWidth, className, ...props },
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
          className,
        )}
        {...props}
      />
    );
  },
);
