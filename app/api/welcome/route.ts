import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, onboardingEmail } from "@/lib/email";

export const runtime = "nodejs";

// Fired right after a member finishes creating their profile. Sends the
// "welcome to the team" email exactly once, guarded by profiles.welcome_email_
// sent_at. Runs as the authenticated user (RLS lets them read/update only their
// own row); the email address comes from the auth session, not the client.
export async function POST(req: Request) {
  let body: { language?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const language = body.language === "es" ? "es" : "en";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, welcome_email_sent_at")
    .eq("id", user.id)
    .maybeSingle();

  // No profile yet, or already welcomed → nothing to do (idempotent).
  if (!profile || profile.welcome_email_sent_at) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { subject, html, text } = onboardingEmail(language, profile.display_name);
  const sent = await sendEmail({ to: user.email, subject, html, text });

  // Only stamp when it actually went out, so a dormant key retries next time.
  if (sent) {
    await supabase
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  return NextResponse.json({ ok: true, sent });
}
