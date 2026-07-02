import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPactDebtsWith } from "@/lib/pact-record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly pact sweep: evaluate every staked pact group and record/announce any
 * newly completed broken weeks. Without this, breaks only surface when a member
 * happens to open the group (the lazy recordPactDebts on group view) — so a
 * quiet team would never get the "pact broken" notification. Idempotent: the
 * ledger's unique constraint means each break is recorded and announced once.
 * Protected by CRON_SECRET, same contract as /api/push/cron.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no-admin" });

  const { data: groups, error } = await admin
    .from("groups")
    .select("id")
    .not("workouts_per_week", "is", null)
    .not("stake_value", "is", null)
    .not("who_pays", "is", null)
    .limit(1000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let recorded = 0;
  for (const g of groups ?? []) {
    recorded += await recordPactDebtsWith(admin, g.id as string);
  }

  return NextResponse.json({ ok: true, groups: groups?.length ?? 0, recorded });
}

// Vercel Cron invokes endpoints with GET (and auto-attaches the CRON_SECRET as
// a Bearer token when set). POST is kept for external schedulers / manual runs.
export const GET = handle;
export const POST = handle;
