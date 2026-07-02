"use client";

import { cn } from "@/lib/utils";

/** A volt on/off switch. Controlled. */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        // 28px visual switch; the ::after overlay extends the hit area to 44pt
        // without changing the layout.
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border transition-colors duration-150 disabled:opacity-50",
        "after:absolute after:-inset-2 after:content-['']",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        checked ? "border-volt bg-volt" : "border-border-strong bg-surface-2",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-pill bg-bg transition-transform duration-150",
          checked ? "translate-x-6" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
