import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile";
import type { Profile } from "@/lib/types";

/**
 * Email-confirmation (and OAuth) callback. The link in the confirmation email
 * points here with a `code`. We exchange it for a session (sets the auth
 * cookies) and route the user into the app — onboarding if their profile isn't
 * complete yet, otherwise home (or the original `next` target).
 *
 * All redirects use NEXT_PUBLIC_BASE_URL (prod domain), falling back to the
 * request origin — never a hardcoded localhost.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const base = (process.env.NEXT_PUBLIC_BASE_URL || origin).replace(/\/$/, "");

  const safeNext =
    nextParam && nextParam.startsWith("/") ? nextParam : null;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let dest = "/onboarding";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (isProfileComplete(profile as Profile | null)) {
          dest = safeNext ?? "/home";
        } else {
          dest = safeNext
            ? `/onboarding?next=${encodeURIComponent(safeNext)}`
            : "/onboarding";
        }
      }
      return NextResponse.redirect(`${base}${dest}`);
    }
  }

  // No code, or exchange failed.
  return NextResponse.redirect(`${base}/login?error=confirm`);
}
