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
  deactivatedAt: string | null;
}

/**
 * `roles` is global reference data (not organization-scoped — see the RLS
 * migration), but `profiles` is already isolated by `organization_id`
 * through RLS, so selecting every profile here only ever returns the
 * caller's own organization. Flat queries joined in JS, same pattern as
 * every other real Data Layer.
 */
async function loadTeamData(): Promise<{ team: TeamProfile[]; roles: RoleOption[] }> {
  const supabase = createSupabaseClient();

  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("id, name, email, avatar_url, role_id, deactivated_at").order("name"),
    supabase.from("roles").select("id, slug, name").order("name"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roleById = new Map((rolesRes.data ?? []).map((role) => [role.id, role]));

  const team = (profilesRes.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    initials: toInitials(profile.name),
    avatarUrl: profile.avatar_url,
    role: profile.role_id ? (roleById.get(profile.role_id) ?? null) : null,
    deactivatedAt: profile.deactivated_at,
  }));

  return { team, roles: rolesRes.data ?? [] };
}

export function useTeam() {
  const [team, setTeam] = useState<TeamProfile[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadTeamData();
      setTeam(data.team);
      setRoles(data.roles);
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
        if (!active) return;
        setTeam(data.team);
        setRoles(data.roles);
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

  return { team, roles, loading, error, refetch };
}

/** Self-service only: name is the one field any user can change on their own profile. */
export async function updateOwnProfile(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe um nome.");

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", id);
  if (error) throw error;
}

/** Requires team.manage — enforced by the profiles_update_team_manager RLS policy, not just the UI. */
export async function updateMemberRole(id: string, roleId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("profiles").update({ role_id: roleId }).eq("id", id);
  if (error) throw error;
}

async function callTeamApi(path: string, body: unknown): Promise<void> {
  const response = await fetch(path, {
    method: path.endsWith("/invite") ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Não foi possível concluir a ação.");
  }
}

export interface InviteMemberInput {
  name: string;
  email: string;
  roleSlug: string;
}

/** Hits the server-only /api/team/invite route — never calls the Admin API from the browser. */
export async function inviteTeamMember(input: InviteMemberInput): Promise<void> {
  await callTeamApi("/api/team/invite", input);
}

/** Hits the server-only /api/team/[id] route — banning a user requires the Admin API. */
export async function setMemberAccess(id: string, action: "deactivate" | "reactivate"): Promise<void> {
  await callTeamApi(`/api/team/${id}`, { action });
}
