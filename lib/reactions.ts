// The small, fixed reaction set (Batch 2 · Section 5). Kept short on purpose —
// a few high-signal reactions, not an emoji keyboard.
export const REACTION_EMOJIS = ["🔥", "👏", "💪", "🙌"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Per-emoji aggregate for one check-in: count, whether you reacted, and who. */
export type ReactionAgg = Record<
  string,
  { count: number; mine: boolean; who: string[] }
>;
