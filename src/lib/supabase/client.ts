import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Browser-side Supabase client. Safe to use in Client Components — the
 * anon key is meant to be public; every table it can reach is protected
 * by Row Level Security (see supabase/migrations/*_rls.sql).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
