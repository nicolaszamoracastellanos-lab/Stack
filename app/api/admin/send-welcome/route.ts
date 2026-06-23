import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, onboardingEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Admin-only sender for the onboarding "welcome to the team" email. Guarded by
 * the ADMIN_TASK_TOKEN env var: if it isn't set, or the x-admin-token header
 * doesn't match, the route 404s — so it's completely inert until configured.
 *
 * Two modes (POST JSON):
 *   { to, name?, language? }      → send ONE email to `to` (preview/test; no DB writes).
 *   { all: true, language?, dryRun? }
 *                                 → backfill: every member whose profile has no
 *                                   welcome_email_sent_at gets the email (greeted
 *                                   by their name, in their saved language), then
 *                                   the row is stamped so reruns are safe. dryRun
 *                                   lists recipients without sending.
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_TASK_TOKEN;
  const provided = req.headers.get("x-admin-token");
  if (!token || provided !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: {
    to?: string;
    name?: string;
    language?: string;
    all?: boolean;
    dryRun?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // ---- Single test/preview send ----
  if (!body.all) {
    if (!body.to) {
      return NextResponse.json({ error: "missing 'to'" }, { status: 400 });
    }
    const { subject, html, text } = onboardingEmail(body.language, body.name);
    const sent = await sendEmail({ to: body.to, subject, html, text });
    return NextResponse.json({ ok: true, mode: "single", to: body.to, sent });
  }

  // ---- Bulk backfill (needs the service role to read every user) ----
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role not configured" },
      { status: 500 },
    );
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, language, welcome_email_sent_at");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = (profiles ?? []).filter((p) => !p.welcome_email_sent_at);

  const result = {
    ok: true,
    mode: "bulk" as const,
    dryRun: Boolean(body.dryRun),
    total: pending.length,
    sent: 0,
    failed: [] as string[],
    noEmail: 0,
  };

  for (const p of pending) {
    // Email lives in auth.users, not profiles — resolve it via the service role.
    const { data: u } = await admin.auth.admin.getUserById(p.id);
    const email = u?.user?.email;
    if (!email) {
      result.noEmail += 1;
      continue;
    }
    if (result.dryRun) {
      result.sent += 1; // counts as "would send"
      continue;
    }

    const { subject, html, text } = onboardingEmail(
      p.language ?? body.language,
      p.display_name,
    );
    const ok = await sendEmail({ to: email, subject, html, text });
    if (ok) {
      await admin
        .from("profiles")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      result.sent += 1;
      // Gentle pace to stay under Resend's per-second rate limit.
      await new Promise((r) => setTimeout(r, 600));
    } else {
      result.failed.push(email);
    }
  }

  return NextResponse.json(result);
}
