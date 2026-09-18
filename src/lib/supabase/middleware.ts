import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

// Reachable without a session — a password-recovery link only establishes
// the (temporary) session client-side, after this request already landed,
// so /reset-password must be let through unauthenticated too or the user
// bounces straight to /login before that session ever exists.
const PUBLIC_PATHS = ["/login", "/reset-password"];

// Of those, only /login makes sense to redirect *away* from once a real
// session exists — an already-authenticated visitor should still be able
// to reach /reset-password (e.g. the recovery link opened in a browser
// that already had a session).
const AUTH_REDIRECT_PATHS = ["/login"];

/**
 * Refreshes the Supabase session on every request and gates the private
 * app routes behind authentication. Called from the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Middleware runs in the Edge Runtime, outside the React tree — a thrown
  // error here never reaches app/error.tsx, it becomes a bare, bodyless
  // 500 (confirmed: this is exactly what happens with a misconfigured/
  // unreachable Supabase project). If Supabase can't be reached at all, we
  // can't determine auth state either way, so let the request through
  // unmodified: the page/layout underneath (getCurrentActor) hits the same
  // Supabase call, and *that* failure is a normal React render error that
  // app/error.tsx catches and explains — one honest failure surface
  // instead of two different broken ones.
  let user: User | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            supabaseResponse = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              supabaseResponse.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // IMPORTANT: do not remove — this call refreshes the auth token and
    // must run on every request for the session to stay alive.
    const {
      data: { user: refreshedUser },
    } = await supabase.auth.getUser();
    user = refreshedUser;
  } catch {
    return supabaseResponse;
  }

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isAuthRedirectPath = AUTH_REDIRECT_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRedirectPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
