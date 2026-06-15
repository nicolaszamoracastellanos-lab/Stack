import { cn } from "@/lib/utils";

type AvatarProps = {
  /** Display name or username — used for initials and the color. */
  name: string;
  /** Optional photo; falls back to initials when absent. */
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-caption",
  md: "h-10 w-10 text-label",
  lg: "h-14 w-14 text-h2",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic hue from the name so a person keeps the same avatar color.
// Saturation/lightness are tuned once for the dark theme; the hue is the only
// thing that varies, so colors stay cohesive rather than hardcoded per-user.
function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

/**
 * Initials on a colored circle. The colored fallback is intentional: most
 * users won't have a profile photo in Phase 1.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const ringBase = "rounded-pill border border-border-strong object-cover";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar urls are signed/remote and short-lived
      <img
        src={src}
        alt={name}
        className={cn(sizes[size], ringBase, className)}
      />
    );
  }

  const hue = hueFromName(name || "?");
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-pill font-semibold text-bg",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${hue} 55% 60%)` }}
    >
      {initials(name)}
    </div>
  );
}
