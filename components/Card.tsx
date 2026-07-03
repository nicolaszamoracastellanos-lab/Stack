import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Use the higher elevation for modals / active states. */
  elevated?: boolean;
  /** Drop the default padding for media-edge layouts (e.g. feed photos). */
  flush?: boolean;
};

/**
 * Surface container with real depth: a vertical surface gradient, a 1px inner
 * top hairline (light from above) and a soft shadow. Borders still define
 * structure; the gradient and hairline make the card read as physical.
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
        elevated ? "depth-raised" : "depth",
        !flush && "p-4",
        className,
      )}
      {...props}
    />
  );
}
