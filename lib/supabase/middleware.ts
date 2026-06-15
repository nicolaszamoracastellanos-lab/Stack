import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require a logged-in user. Everything else (/, /login, /signup,
// /join/[code]) is reachable logged-out. Profile/username gating (logged in but
// no username yet -> /onboarding) is handled in the (app) layout, which already
// queries the profile, to avoid a DB round-trip in middleware on every request.
const PROTECTED = ["/home", "/checkin", "/profile", "/groups"];
const AUTH_ONLY = ["/onboarding"];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

/**
 * Refreshes the Supabase auth session on every request (keeps cookies fresh)
 * and enforces auth redirects:
 *   - logged-out user hitting a protected route  -> /login?next=...
 *   - logged-in user hitting /login or /signup   -> /home
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && (matches(path, PROTECTED) || matches(path, AUTH_ONLY))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
