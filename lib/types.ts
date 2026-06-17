// Database row shapes (Phase 1). Kept hand-written and small; if the schema
// grows, consider generating these with the Supabase CLI.

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  favorite_sport: string | null;
  usual_activity: string | null;
  focus_sport: string | null;
  avatar_url: string | null;
  /** Privacy: when false, hide streak/longest/total from other group members. */
  show_stats: boolean;
  /** First-run: welcome story seen, feature tour completed (Onboarding). */
  has_seen_welcome: boolean;
  has_completed_tour: boolean;
  /** Check-in prefs (Batch 3): flow order + chosen card template. */
  checkin_order: "details" | "photo";
  card_template: string;
  /** IANA timezone, captured at onboarding, backfilled on load (Batch 5 A2). */
  timezone: string | null;
  /** When true, check-in selfies post mirrored; default false = true orientation (Batch 5 A1). */
  selfie_mirror_default: boolean;
  // Streak Engine v2 + tiers (Batch 5 C). All nullable until the goal is set.
  /** Weekly goal Q (1–7): target workouts/week, the streak source of truth. */
  weekly_goal: number | null;
  /** Monday (YYYY-MM-DD) from which quota rules apply; grace before it. */
  quota_active_from: string | null;
  /** Preferred rest days, cosmetic: 0=Mon … 6=Sun (Batch 5 C3). */
  preferred_rest_days: number[];
  /** Confirmed tier key (moves monthly); null = level zero. */
  tier_confirmed: string | null;
  /** Provisional tier key shown in the first weeks before confirmation. */
  tier_provisional: string | null;
  // Notifications (Batch 5 D).
  notif_master: boolean;
  /** Per-type on/off; absent key = on. */
  notif_types: Record<string, boolean>;
  /** Quiet hours in local time (24h); default 22→8. */
  quiet_start: number;
  quiet_end: number;
  /** Language for localized push copy. */
  language: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  goal: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
  // Pact identity (Batch 4) — all optional.
  intention: string | null;
  motivation: string | null;
  end_goal: string | null;
  meaning: string | null;
  // Pact rules — workouts_per_week set ⇒ the group is a pact.
  workouts_per_week: number | null;
  allowed_disciplines: string[];
  duration_type: "fixed" | "ongoing" | null;
  duration_weeks: number | null;
  pact_start_date: string | null;
  pact_end_date: string | null;
  stake_type: "money" | "favor" | "custom" | null;
  stake_value: string | null;
  who_pays: "breaker" | "any_misser" | "last_place" | null;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type Checkin = {
  id: string;
  /** null = a "Just me" personal log (Batch 5 B2), shown to no group. */
  group_id: string | null;
  user_id: string;
  photo_url: string;
  note: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  checkin_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};
