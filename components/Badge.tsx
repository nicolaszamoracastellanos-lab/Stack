import { cn } from "@/lib/utils";

/**
 * Unread/attention indicators. Volt, not red — red is reserved for the
 * at-risk streak, and "you have messages" is a good thing here.
 */

/** Small presence dot (unread chat, live signal). */
export function Dot({
  className,
  label,
}: {
  className?: string;
  /** Accessible meaning of the dot, e.g. "Unread messages". */
  label?: string;
}) {
  return (
    <span
      aria-label={label}
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block h-2 w-2 rounded-pill bg-volt", className)}
    />
  );
}

/** Numeric count pill (notification bell, unread messages). */
export function CountBadge({
  count,
  max = 99,
  className,
}: {
  count: number;
  max?: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center",
        "rounded-pill bg-volt px-1 text-micro font-bold text-bg nums",
        className,
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
