import type { TeamMember } from "@/lib/types";

export const currentUser: TeamMember = {
  id: "daniel",
  name: "Daniel",
  initials: "DA",
  role: "Diretor de Operações",
};

export const team: TeamMember[] = [
  currentUser,
  { id: "fernanda", name: "Fernanda", initials: "FE", role: "Social Media" },
  { id: "mariana", name: "Mariana", initials: "MA", role: "Gestora de Projetos" },
  { id: "bruno", name: "Bruno", initials: "BR", role: "Redator" },
  { id: "camila", name: "Camila", initials: "CA", role: "Designer" },
];

// Bridges real Supabase profiles (UUID ids) into the same lookup used
// throughout the still-mock-backed UI (ClientTable, ClientHeader, ...),
// so those approved components keep working unmodified as modules move
// from mock data to Supabase one at a time. Populated by the real data
// layer (src/lib/data/*) whenever it resolves a profile.
const supabaseProfileCache = new Map<string, TeamMember>();

export function registerSupabaseProfile(profile: TeamMember): void {
  supabaseProfileCache.set(profile.id, profile);
}

export function getTeamMember(id: string): TeamMember | undefined {
  return team.find((member) => member.id === id) ?? supabaseProfileCache.get(id);
}
