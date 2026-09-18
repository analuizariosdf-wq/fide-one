import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/auth/permissions";

export interface CurrentActor {
  user: { id: string; email: string } | null;
  profile: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    organizationId: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    displayName: string | null;
    accentColor: string | null;
    faviconUrl: string | null;
  } | null;
  organizationId: string | null;
  role: { id: string; slug: string; name: string } | null;
  permissions: PermissionKey[];
}

const EMPTY_ACTOR: CurrentActor = {
  user: null,
  profile: null,
  organization: null,
  organizationId: null,
  role: null,
  permissions: [],
};

/**
 * Resolves the signed-in user, their profile, role and organization in one
 * server-side pass (three flat queries, no PostgREST embeds — see the
 * Data Layer files for why). Called once per request from the `(app)`
 * layout and handed down via CurrentActorProvider, so pages/components
 * never re-fetch this themselves.
 *
 * `organizationId` always comes from the profile row resolved here, never
 * from anything the client could have sent — RLS re-checks it regardless,
 * but the app never trusts a client-supplied value either.
 */
export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return EMPTY_ACTOR;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, organization_id, role_id")
    .eq("id", user.id)
    .single();

  if (!profileRow) {
    return { ...EMPTY_ACTOR, user: { id: user.id, email: user.email } };
  }

  const [{ data: organizationRow }, { data: roleRow }, { data: permissionRows }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, logo_url, display_name, accent_color, favicon_url")
      .eq("id", profileRow.organization_id)
      .single(),
    profileRow.role_id
      ? supabase.from("roles").select("id, slug, name").eq("id", profileRow.role_id).single()
      : Promise.resolve({ data: null }),
    profileRow.role_id
      ? supabase.from("role_permissions").select("permission_key").eq("role_id", profileRow.role_id)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    user: { id: user.id, email: user.email },
    profile: {
      id: profileRow.id,
      name: profileRow.name,
      email: profileRow.email,
      avatarUrl: profileRow.avatar_url,
      organizationId: profileRow.organization_id,
    },
    organization: organizationRow
      ? {
          id: organizationRow.id,
          name: organizationRow.name,
          slug: organizationRow.slug,
          logoUrl: organizationRow.logo_url,
          displayName: organizationRow.display_name,
          accentColor: organizationRow.accent_color,
          faviconUrl: organizationRow.favicon_url,
        }
      : null,
    organizationId: profileRow.organization_id,
    role: roleRow ? { id: roleRow.id, slug: roleRow.slug, name: roleRow.name } : null,
    permissions: (permissionRows ?? []).map((row) => row.permission_key) as PermissionKey[],
  };
}
