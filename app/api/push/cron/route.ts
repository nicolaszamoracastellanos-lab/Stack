import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { computeQuotaStreak } from "@/lib/streak-quota";
import { currentWeekFreq } from "@/lib/tier-eval";
import { tierProjection } from "@/lib/tiers";
import { dayKey, weekdayMon0 } from "@/lib/week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Time-based triggers (Batch 5 D3): self-nudge, at-risk, and the weekly tier
 * projection. Designed to be hit by a scheduler (e.g. a Vercel cron) every hour;
 * each trigger fires at a single local hour per user so an hourly run never
 * double-sends. Protected by CRON_SECRET.
 *
 * Fire hours (user-local): at-risk 18:00, self-nudge 19:00, projection 20:00
 * (Sundays only).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

function localHour(tz: string | null): number {
  try {
    return (
      Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz || "UTC",
          hour: "2-digit",
          hour12: false,
        }).format(new Date()),
      ) % 24
    );
  } catch {
    return new Date().getUTCHours();
  }
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no-admin" });

  const now = new Date();

  // Only users with a subscription are candidates.
  const { data: subRows } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .limit(5000);
  const userIds = Array.from(new Set((subRows ?? []).map((r) => r.user_id as string)));

  // Manual test mode (?test=<type>): fire one notification to every current
  // subscriber immediately, bypassing the hour gate + quiet hours. Secret-gated;
  // intended for verifying setup while you're the only subscriber.
  const testType = new URL(req.url).searchParams.get("test");
  if (testType) {
    const type = (testType === "1" ? "at_risk" : testType) as never;
    let tested = 0;
    for (const userId of userIds) {
      tested += await sendPushToUser(admin, userId, type, {}, "/home", {
        force: true,
      });
    }
    return NextResponse.json({ ok: true, mode: "test", subscribers: userIds.length, tested });
  }

  let fired = 0;
  for (const userId of userIds) {
    const { data: prof } = await admin
      .from("profiles")
      .select(
        "weekly_goal, quota_active_from, preferred_rest_days, timezone, tier_confirmed",
      )
      .eq("id", userId)
      .maybeSingle();
    if (!prof) continue;

    const tz = (prof.timezone as string | null) ?? null;
    const hour = localHour(tz);
    const todayKey = dayKey(now, tz);
    const isSunday = weekdayMon0(todayKey) === 6;

    // Only do work at the relevant fire hours.
    if (hour !== 18 && hour !== 19 && !(isSunday && hour === 20)) continue;

    const { data: ckRows } = await admin
      .from("checkins")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(400);
    const dates = (ckRows ?? []).map((r) => r.created_at as string);
    const { data: restRows } = await admin
      .from("rest_days")
      .select("day")
      .eq("user_id", userId);
    const restDays = (restRows ?? []).map((r) => r.day as string);

    const streak = computeQuotaStreak(dates, {
      weeklyGoal: (prof.weekly_goal as number | null) ?? null,
      quotaActiveFromKey: (prof.quota_active_from as string | null) ?? null,
      restDayKeys: restDays,
      now,
    });
    const loggedToday = streak.workedToday;
    const preferredRest = ((prof.preferred_rest_days as number[]) ?? []).includes(
      weekdayMon0(todayKey),
    );

    // At-risk (18:00): slack used up and not yet trained today.
    if (hour === 18 && streak.state === "at-risk" && !loggedToday) {
      fired += await sendPushToUser(admin, userId, "at_risk", {}, "/home");
    }

    // Self-nudge (19:00): no log today, not a preferred rest day, quota not yet
    // banked (still needs the workout this week).
    if (
      hour === 19 &&
      !loggedToday &&
      !preferredRest &&
      streak.needed > 0 &&
      streak.slack >= 0
    ) {
      fired += await sendPushToUser(admin, userId, "self_nudge", {}, "/checkin");
    }

    // Weekly tier projection (Sunday 20:00).
    if (isSunday && hour === 20) {
      const wf = currentWeekFreq(dates, now);
      const proj = tierProjection(wf, (prof.tier_confirmed as never) ?? null);
      if (proj.direction !== "steady") {
        fired += await sendPushToUser(admin, userId, "tier_projection", {}, "/tiers");
      }
    }
  }

  // Record the run for the founder env readout (§4.6). Best-effort.
  await admin
    .from("kv_meta")
    .upsert(
      {
        key: "cron_last_run",
        value: { at: now.toISOString(), candidates: userIds.length, fired },
        updated_at: now.toISOString(),
      },
      { onConflict: "key" },
    )
    .then(() => {});

  return NextResponse.json({ ok: true, candidates: userIds.length, fired });
}

// Vercel Cron invokes endpoints with GET (and auto-attaches the CRON_SECRET as
// a Bearer token when set). POST is kept for external schedulers / manual runs.
export const GET = handle;
export const POST = handle;
