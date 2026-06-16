import type { TranslationKey } from "@/lib/i18n";

/**
 * Story-card templates (Batch 3 §3). Designed as an extensible set: add a new
 * entry here + a branch in <StoryCard> and it appears in the picker.
 * `milestone` variants are only offered when a streak milestone is hit.
 */
export type CardTemplateKey = "minimal" | "bold" | "stat" | "photo" | "milestone";

export type CardTemplate = {
  key: CardTemplateKey;
  nameKey: TranslationKey;
  milestoneOnly?: boolean;
};

export const CARD_TEMPLATES: CardTemplate[] = [
  { key: "minimal", nameKey: "card_tpl_minimal" },
  { key: "bold", nameKey: "card_tpl_bold" },
  { key: "stat", nameKey: "card_tpl_stat" },
  { key: "photo", nameKey: "card_tpl_photo" },
];

export const MILESTONE_TEMPLATE: CardTemplate = {
  key: "milestone",
  nameKey: "card_tpl_milestone",
  milestoneOnly: true,
};

export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

export function isMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export type CardToggles = {
  sportEnv: boolean;
  focus: boolean;
  notes: boolean;
  streak: boolean;
  date: boolean;
};

export const DEFAULT_TOGGLES: CardToggles = {
  sportEnv: true,
  focus: true,
  notes: false,
  streak: true,
  date: true,
};
