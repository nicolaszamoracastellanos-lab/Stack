import type { Profile } from "@/lib/types";

// Fields every user must fill during onboarding before reaching the app.
// `bio` is intentionally excluded — it's optional.
export const REQUIRED_PROFILE_FIELDS: (keyof Profile)[] = [
  "username",
  "avatar_url",
  "display_name",
  "favorite_sport",
  "usual_activity",
  "focus_sport",
];

/**
 * A profile is "complete" once every required field is a non-empty string.
 * Pure — used by the (app) gate (server), the onboarding page (server), and
 * the login redirect (client), so it must not import anything server-only.
 */
export function isProfileComplete(p: Profile | null | undefined): boolean {
  if (!p) return false;
  return REQUIRED_PROFILE_FIELDS.every((k) => {
    const v = p[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}
