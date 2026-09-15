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

export function getTeamMember(id: string): TeamMember | undefined {
  return team.find((member) => member.id === id);
}
