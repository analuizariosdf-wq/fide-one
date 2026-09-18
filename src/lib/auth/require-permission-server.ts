import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/auth/permissions";

/**
 * Server-side gate for Route Handlers / Server Actions — the UI check
 * (useHasPermission) is only ever a convenience; this is the one that
 * actually matters before a privileged operation (e.g. inviting a member
 * via the Admin API) runs. Uses the caller's own session client (never
 * service_role) to call the same `has_permission` SQL function RLS
 * policies use, so "am I allowed" is answered identically everywhere.
 */
export async function requireServerPermission(
  permission: PermissionKey,
): Promise<{ userId: string; organizationId: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data: allowed, error } = await supabase.rpc("has_permission", { perm: permission });
  if (error || !allowed) throw new Error("Você não tem permissão para esta ação.");

  return { userId: user.id, organizationId: profile.organization_id };
}
