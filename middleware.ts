import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // api/cron/* is excluded on purpose: those routes are called by
    // Vercel's cron trigger (and manual test calls) with no browser
    // session/cookies at all, and authenticate themselves via
    // Authorization: Bearer $CRON_SECRET inside the route handler — the
    // user-session redirect below would otherwise bounce them to /login
    // before that check ever runs. Every other route (including the rest
    // of /api/*) keeps going through the normal session gate.
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
