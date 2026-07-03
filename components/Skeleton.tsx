import { cn } from "@/lib/utils";

/**
 * Loading placeholder blocks. Compose these into screen-shaped ghosts in
 * `loading.tsx` files so content pops in where the eye already is.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-card bg-surface-2", className)}
    />
  );
}

/** A ghost of the standard feed/list card. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "shimmer rounded-card border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-pill bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded-pill bg-surface-2" />
          <div className="h-3 w-1/2 rounded-pill bg-surface-2" />
        </div>
      </div>
      <div className="mt-4 h-3 w-2/3 rounded-pill bg-surface-2" />
    </div>
  );
}
