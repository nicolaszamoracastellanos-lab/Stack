"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required — icon-only buttons are invisible to screen readers without it. */
  "aria-label": string;
};

/**
 * 44pt round icon button — the close/kebab/bell chrome. Resting-state
 * contrast (not hover-only), tactile press, visible keyboard focus.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center",
          "rounded-pill text-text-muted transition duration-150",
          "hover:bg-surface-2 hover:text-text active:scale-[0.96] active:bg-surface-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/60",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          className,
        )}
        {...props}
      />
    );
  },
);
