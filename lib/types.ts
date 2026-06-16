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
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  goal: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type Checkin = {
  id: string;
  group_id: string;
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
