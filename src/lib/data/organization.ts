import { createClient } from "@/lib/supabase/client";

/**
 * Resolves the signed-in user's organization_id. Every write in the real
 * Data Layer needs this explicitly — RLS's `WITH CHECK` only verifies the
 * value we send matches the caller's org, it doesn't fill it in for us.
 */
export async function getCurrentOrganizationId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível identificar sua organização.");
  }

  return data.organization_id;
}
