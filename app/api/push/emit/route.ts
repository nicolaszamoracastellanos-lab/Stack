import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify, notifyMany } from "@/lib/notifications";
import { dayKey } from "@/lib/week";

export const runtime = "nodejs";

/**
 * Event-driven notifications (STACK_BATCH6 Stage 1). Called by client actions
 * right after they create the underlying event. The actor is authenticated via
 * their session; recipients are resolved server-side with the service role.
 * Each event goes through notify() (one row + push from that row).
 *
 *   { event: "checkin",  groupIds: string[], postId?: string }
 *   { event: "join",     groupId: string }
 *   { event: "nudge",    targetUserId: string, groupId?: string }
 *   { event: "reaction", checkinId: string }
 *   { event: "comment",  checkinId: string, snippet?: string }
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
    checkinId?: string;
    postId?: string;
    snippet?: string;
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
  // Resolve a check-in's author + group (for reaction/comment notifications).
  async function checkinOwner(checkinId: string) {
    const { data } = await admin!
      .from("checkins")
      .select("user_id, group_id")
      .eq("id", checkinId)
      .maybeSingle();
    return data as { user_id: string; group_id: string | null } | null;
  }

  if (body.event === "checkin" && Array.isArray(body.groupIds)) {
    const todayKey = dayKey(new Date(), actorTz);
    for (const groupId of body.groupIds) {
      // Cap group_post at one per member per day: only notify on the first post
      // of the day in this group (avoids spam on multiple posts).
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
      if (todayCount > 1) continue; // already notified today for this group

      const [name, recipients] = await Promise.all([
        groupName(groupId),
        membersExceptActor(groupId),
      ]);
      await notifyMany(admin, recipients, {
        type: "group_post",
        actorId: user.id,
        groupId,
        targetType: "post",
        targetId: body.postId ?? null,
        data: { name: actorName, group: name },
        url: "/home",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.event === "join" && body.groupId) {
    const [name, recipients] = await Promise.all([
      groupName(body.groupId),
      membersExceptActor(body.groupId),
    ]);
    await notifyMany(admin, recipients, {
      type: "group_join",
      actorId: user.id,
      groupId: body.groupId,
      targetType: "group",
      targetId: body.groupId,
      data: { name: actorName, group: name },
      url: `/groups/${body.groupId}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.event === "nudge" && body.targetUserId) {
    await notify(admin, {
      recipientId: body.targetUserId,
      type: "nudge",
      actorId: user.id,
      groupId: body.groupId ?? null,
      data: { name: actorName },
      url: "/home",
    });
    return NextResponse.json({ ok: true });
  }

  if (body.event === "reaction" && body.checkinId) {
    const owner = await checkinOwner(body.checkinId);
    if (owner) {
      await notify(admin, {
        recipientId: owner.user_id,
        type: "reaction",
        actorId: user.id,
        groupId: owner.group_id,
        targetType: "post",
        targetId: body.checkinId,
        data: { name: actorName },
        url: "/home",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.event === "comment" && body.checkinId) {
    const owner = await checkinOwner(body.checkinId);
    if (owner) {
      await notify(admin, {
        recipientId: owner.user_id,
        type: "comment",
        actorId: user.id,
        groupId: owner.group_id,
        targetType: "post",
        targetId: body.checkinId,
        data: { name: actorName, snippet: (body.snippet ?? "").slice(0, 80) },
        url: "/home",
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown event" }, { status: 400 });
}
