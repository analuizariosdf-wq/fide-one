import type { TeamMember } from "@/lib/types";

// Bridges real Supabase profiles (UUID ids) into the same lookup used by
// still-mock-adjacent display components (ClientTable, ClientHeader, ...)
// and by every real Data Layer's cross-entity display (assignee,
// responsável). Populated by src/lib/data/*.ts whenever it resolves a
// profile.
//
// The demo `currentUser`/`team` array this file held through Fase 5.1 was
// removed in Fase 5.8: every module that could pass a mock member id into
// getTeamMember() (Clientes, Projetos, Tarefas, Conteúdos) is real now, so
// the id is always a real profile UUID and that branch never matched
// anything. The Dashboard's own "current user" now comes from
// useCurrentActor() (the authenticated session), not from this file.
const supabaseProfileCache = new Map<string, TeamMember>();

export function registerSupabaseProfile(profile: TeamMember): void {
  supabaseProfileCache.set(profile.id, profile);
}

export function getTeamMember(id: string): TeamMember | undefined {
  return supabaseProfileCache.get(id);
}
