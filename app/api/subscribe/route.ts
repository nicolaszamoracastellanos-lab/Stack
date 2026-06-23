import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, welcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public newsletter / updates signup from the landing page. Stores the email
// and fires a one-time welcome (best-effort). Uses the service role when it's
// configured (lets us send once and stamp welcomed_at); otherwise falls back to
// an anon insert allowed by RLS, and the welcome simply waits on the key.
export async function POST(req: Request) {
  let body: { email?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const language = body.language === "es" ? "es" : "en";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (admin) {
    // ignoreDuplicates → ON CONFLICT DO NOTHING. A returned row means it's a
    // brand-new subscriber, so we send the welcome exactly once.
    const { data, error } = await admin
      .from("waitlist")
      .upsert(
        { email, language, source: "landing" },
        { onConflict: "email", ignoreDuplicates: true },
      )
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const isNew = Array.isArray(data) && data.length > 0;
    if (isNew) {
      const { subject, html, text } = welcomeEmail(language);
      const sent = await sendEmail({ to: email, subject, html, text });
      if (sent) {
        await admin
          .from("waitlist")
          .update({ welcomed_at: new Date().toISOString() })
          .eq("email", email);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // No service role (e.g. local dev): anon insert via RLS. 23505 = already on
  // the list, which we treat as success.
  const supabase = createClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email, language, source: "landing" });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
