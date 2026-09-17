"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { toInitials } from "@/lib/utils";

export interface RoleOption {
  id: string;
  slug: string;
  name: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  role: RoleOption | null;
}

/**
 * `roles` is global reference data (not organization-scoped — see the RLS
 * migration), but `profiles` is already isolated by `organization_id`
 * through RLS, so selecting every profile here only ever returns the
 * caller's own organization. Flat queries joined in JS, same pattern as
 * every other real Data Layer.
 */
async function loadTeamData(): Promise<TeamProfile[]> {
  const supabase = createSupabaseClient();

  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("id, name, email, avatar_url, role_id").order("name"),
    supabase.from("roles").select("id, slug, name"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roleById = new Map((rolesRes.data ?? []).map((role) => [role.id, role]));

  return (profilesRes.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    initials: toInitials(profile.name),
    avatarUrl: profile.avatar_url,
    role: profile.role_id ? (roleById.get(profile.role_id) ?? null) : null,
  }));
}

export function useTeam() {
  const [team, setTeam] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeam(await loadTeamData());
    } catch {
      setError("Não foi possível carregar a equipe. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadTeamData()
      .then((data) => {
        if (active) setTeam(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a equipe. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { team, loading, error, refetch };
}

/**
 * RLS ("profiles_update_self") only allows a row to be updated when
 * `id = auth.uid()` — there is no policy letting anyone edit a colleague's
 * profile, so this can only ever update the caller's own row. `role_id` is
 * intentionally not editable here: changing your own role is not something
 * the UI offers, even though nothing in the RLS check clause itself
 * distinguishes columns — see docs/project-status.md for why role
 * management stays out of this MVP.
 */
export async function updateOwnProfile(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe um nome.");

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", id);
  if (error) throw error;
}
