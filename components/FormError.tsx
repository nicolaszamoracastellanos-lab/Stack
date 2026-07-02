import { cn } from "@/lib/utils";

/**
 * The one inline error banner. Deliberately neutral — red belongs to the
 * at-risk streak alone, so errors lean on the raised surface, the strong
 * border, the glyph and the copy to read as "something went wrong".
 * Renders nothing when there is no message, so callers can pass state directly.
 */
export function FormError({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-input border border-border-strong",
        "bg-surface-2 px-3 py-2.5 text-label text-text",
        className,
      )}
    >
      <span aria-hidden className="leading-[1.4]">
        ⚠️
      </span>
      <span>{children}</span>
    </div>
  );
}
