import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Use the slightly elevated surface for modals / active states. */
  elevated?: boolean;
  /** Drop the default padding for media-edge layouts (e.g. feed photos). */
  flush?: boolean;
};

/**
 * Surface container with a hairline border and 12px radius. In this dark UI
 * borders define structure — we lean on them instead of shadows.
 */
export function Card({
  elevated,
  flush,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border",
        elevated ? "bg-surface-2" : "bg-surface",
        !flush && "p-4",
        className,
      )}
      {...props}
    />
  );
}
