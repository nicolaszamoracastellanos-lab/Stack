"use server";

import { getFounder } from "@/lib/founder";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils";
import { dayKey, addDaysKey } from "@/lib/week";

export type DemoResult = { ok: boolean; error?: string; count?: number };

/**
 * Seed a founder-owned demo group (§6) tagged is_demo, with sample check-ins so
 * the feed, heatmap and story cards can be exercised. Founder-scoped: created_by
 * is the founder, and only the founder is a member. (Fabricating fake auth.users
 * for multi-member leaderboard/reactions is intentionally NOT done — see flag.)
 */
export async function seedDemo(): Promise<DemoResult> {
  const f = await getFounder();
  if (!f) return { ok: false, error: "forbidden" };
  const supabase = createClient();

  // Reuse one of the founder's REAL check-in photos so demo posts render (the
  // private bucket signs it). We never delete this photo on wipe.
  const { data: lastPhoto } = await supabase
    .from("checkins")
    .select("photo_url")
    .eq("user_id", f.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const photo = (lastPhoto?.photo_url as string) ?? "demo/placeholder.jpg";

  // Create the demo group (retry invite-code collisions).
  let groupId: string | null = null;
  for (let i = 0; i < 4 && !groupId; i++) {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: "🧪 Demo Group",
        goal: "Founder QA — safe to delete",
        invite_code: generateInviteCode(),
        created_by: f.userId,
        is_demo: true,
      })
      .select("id")
      .single();
    if (data) groupId = data.id as string;
    else if (error && error.code !== "23505") return { ok: false, error: error.message };
  }
  if (!groupId) return { ok: false, error: "could not create demo group" };

  await supabase.from("group_members").insert({ group_id: groupId, user_id: f.userId });

  // Sample check-ins over the last several days.
  const samples = [
    { sport: "running", environment: "outdoor", goal: "endurance", note: "Demo: morning 5k." },
    { sport: "gym", environment: "indoor", goal: "strength", note: "Demo: push day." },
    { sport: "cycling", environment: "outdoor", goal: "endurance", note: "Demo: long ride." },
    { sport: "yoga", environment: "indoor", goal: "mobility", note: "Demo: recovery flow." },
    { sport: "swimming", environment: "indoor", goal: "endurance", note: "Demo: 1km swim." },
  ];
  const today = dayKey(new Date());
  const rows = samples.map((s, i) => ({
    group_id: groupId,
    user_id: f.userId,
    photo_url: photo,
    note: s.note,
    sport: s.sport,
    environment: s.environment,
    goal: s.goal,
    post_id: crypto.randomUUID(),
    is_demo: true,
    created_at: `${addDaysKey(today, -i)}T09:00:00`,
  }));
  const { error: ckErr } = await supabase.from("checkins").insert(rows);
  if (ckErr) return { ok: false, error: ckErr.message };

  return { ok: true, count: rows.length };
}

/**
 * Wipe ALL founder demo data (§6): delete the founder's is_demo groups — the
 * cascade removes their members, check-ins, reactions and comments. Real data
 * (non-demo groups/check-ins) and the reused photo are untouched.
 */
export async function wipeDemo(): Promise<DemoResult> {
  const f = await getFounder();
  if (!f) return { ok: false, error: "forbidden" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from("groups")
    .delete()
    .eq("created_by", f.userId)
    .eq("is_demo", true)
    .select("id");
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: data?.length ?? 0 };
}
