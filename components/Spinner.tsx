import { cn } from "@/lib/utils";

/**
 * Inline spinner for in-button busy states. Page-level loads should use
 * Skeleton instead — a lone spinner is a last resort.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-pill",
        "border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
