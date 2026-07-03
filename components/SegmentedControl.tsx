"use client";

import { cn } from "@/lib/utils";

/**
 * Whoop-style full-width segmented control with an animated sliding thumb:
 * the volt fill physically glides to the active segment instead of teleporting.
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
  const activeIdx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      className={cn(
        "depth relative flex w-full rounded-pill border border-border p-1",
        className,
      )}
      role="tablist"
    >
      {/* The sliding thumb — transform-only, GPU-composited. Width equals one
          segment (content width / N), so translateX(idx * 100%) lands each
          stop exactly. */}
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-pill bg-volt transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          left: "0.25rem",
          transform: `translateX(${activeIdx * 100}%)`,
        }}
      />
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
              "relative min-h-11 flex-1 rounded-pill px-3 py-2 text-label font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/60",
              active ? "text-bg" : "text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
