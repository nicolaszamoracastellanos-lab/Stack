/**
 * Mentions (STACK_BATCH6 Stage 4). A mention is stored inline in the message /
 * comment body as a token: `@[Display Name](user-uuid)`. The user_id is the
 * source of truth; the name is just for display. Group-scoped: the autocomplete
 * and the server only ever offer / accept members of the relevant group.
 */

// uuid v4-ish; group 1 = display name, group 2 = user id.
export const MENTION_RE =
  /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export function formatMention(name: string, userId: string): string {
  // Strip characters that would break the token.
  const clean = name.replace(/[[\]()]/g, "").trim() || "member";
  return `@[${clean}](${userId})`;
}

/** Distinct user ids referenced by mention tokens in `body`. */
export function extractMentionUserIds(body: string): string[] {
  const ids = new Set<string>();
  const re = new RegExp(MENTION_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) ids.add(m[2]);
  return Array.from(ids);
}

export type MentionMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};
