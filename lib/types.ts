// Database row shapes (Phase 1). Kept hand-written and small; if the schema
// grows, consider generating these with the Supabase CLI.

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
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
