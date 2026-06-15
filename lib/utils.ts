/**
 * Tiny class-name joiner. We deliberately avoid pulling in clsx /
 * tailwind-merge — the spec asks for zero extra UI libraries, and a join
 * helper is all the components need. Falsy values are dropped so you can do
 * cn("base", active && "active", disabled && "opacity-50").
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Invite codes: 6 uppercase chars from an unambiguous alphabet (no 0/O, 1/I/L).
// Short enough to read aloud, large enough to avoid collisions at our scale.
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return out;
}

/**
 * Compact relative timestamp for the feed: "just now", "5m", "3h", "2d".
 * `nowLabel` is the translated "just now" string so this stays language-aware
 * while the m/h/d units (universal) need no translation. `nowMs` is injected so
 * callers can keep it stable and testable.
 */
export function formatRelativeTime(
  date: string | number | Date,
  nowMs: number,
  nowLabel: string,
): string {
  const then = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffSec < 45) return nowLabel;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}
