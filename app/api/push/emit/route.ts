import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { dayKey } from "@/lib/week";

export const runtime = "nodejs";

/**
 * Event-driven push fan-out (Batch 5 D3). Called by client actions right after
 * they create the underlying event (a check-in, a join, a nudge). The actor is
 * authenticated via their session; recipients + copy are resolved server-side
 * with the service role so a user can't address arbitrary people.
 *
 *   { event: "checkin", groupIds: string[] }
 *   { event: "join",    groupId: string }
 *   { event: "nudge",   targetUserId: string }
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no-admin" });

  let body: {
    event?: string;
    groupIds?: string[];
    groupId?: string;
    targetUserId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { data: actorProf } = await admin
    .from("profiles")
    .select("display_name, username, timezone")
    .eq("id", user.id)
    .maybeSingle();
  const actorName =
    actorProf?.display_name?.trim() ||
    (actorProf?.username ? `@${actorProf.username}` : "Someone");
  const actorTz = (actorProf as { timezone?: string | null })?.timezone ?? null;

  async function membersExceptActor(groupId: string): Promise<string[]> {
    const { data } = await admin!
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    return (data ?? [])
      .map((m) => m.user_id as string)
      .filter((id) => id !== user!.id);
  }
  async function groupName(groupId: string): Promise<string> {
    const { data } = await admin!
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .maybeSingle();
    return (data?.name as string) ?? "your group";
  }

  if (body.event === "checkin" && Array.isArray(body.groupIds)) {
    const todayKey = dayKey(new Date(), actorTz);
    for (const groupId of body.groupIds) {
      const [name, recipients] = await Promise.all([
        groupName(groupId),
        membersExceptActor(groupId),
      ]);
      // First of the day for this member in this group? (one member_workout/day)
      const { data: mine } = await admin
        .from("checkins")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(10);
      const todayCount = (mine ?? []).filter(
        (c) => dayKey(new Date(c.created_at as string), actorTz) === todayKey,
      ).length;
      const type = todayCount <= 1 ? "member_workout" : "group_post";
      await Promise.all(
        recipients.map((uid) =>
          sendPushToUser(admin, uid, type, { name: actorName, group: name }),
        ),
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (body.event === "join" && body.groupId) {
    const [name, recipients] = await Promise.all([
      groupName(body.groupId),
      membersExceptActor(body.groupId),
    ]);
    await Promise.all(
      recipients.map((uid) =>
        sendPushToUser(admin, uid, "group_join", { name: actorName, group: name }),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  if (body.event === "nudge" && body.targetUserId) {
    await sendPushToUser(admin, body.targetUserId, "member_nudge", {
      name: actorName,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown event" }, { status: 400 });
}
