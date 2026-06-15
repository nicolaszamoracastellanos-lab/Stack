"use client";

import { cn } from "@/lib/utils";

/**
 * Whoop-style full-width segmented control. The active segment fills volt.
 * Generic over the option value so callers stay type-safe.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full rounded-pill border border-border bg-surface p-1",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-pill px-3 py-2 text-label font-medium transition-colors duration-150",
              active
                ? "bg-volt text-bg"
                : "text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
