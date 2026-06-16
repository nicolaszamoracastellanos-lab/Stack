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
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border transition-colors duration-150 disabled:opacity-50",
        checked ? "border-volt bg-volt" : "border-border-strong bg-surface-2",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-pill bg-bg transition-transform duration-150",
          checked ? "translate-x-[1.4rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
