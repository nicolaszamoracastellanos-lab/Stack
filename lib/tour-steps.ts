import type { TranslationKey } from "@/lib/i18n";

/**
 * Feature-tour steps (Part 2). `target` is the `data-tour` attribute of a real
 * Home element to spotlight, or null for an explanation-only step (centered, no
 * spotlight) — used where the element doesn't live on Home (at-risk/nudge) or
 * for the final call to action. Missing targets are also handled gracefully at
 * runtime (fall back to centered).
 */
export type TourStep = {
  target: string | null;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

export const TOUR_STEPS: TourStep[] = [
  { target: "home-header", titleKey: "tour1_title", bodyKey: "tour1_body" },
  { target: "nav-checkin", titleKey: "tour2_title", bodyKey: "tour2_body" },
  { target: "ring", titleKey: "tour3_title", bodyKey: "tour3_body" },
  { target: "streaks", titleKey: "tour4_title", bodyKey: "tour4_body" },
  { target: "feed", titleKey: "tour5_title", bodyKey: "tour5_body" },
  { target: null, titleKey: "tour6_title", bodyKey: "tour6_body" },
  { target: "nav-groups", titleKey: "tour7_title", bodyKey: "tour7_body" },
  { target: "nav-profile", titleKey: "tour8_title", bodyKey: "tour8_body" },
  { target: null, titleKey: "tour9_title", bodyKey: "tour9_body" },
];
