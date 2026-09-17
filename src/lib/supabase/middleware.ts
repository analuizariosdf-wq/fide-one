import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/login"];

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

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
