import type { ActivityItem } from "@/lib/types";

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    actorId: "fernanda",
    type: "task_completed",
    description: 'concluiu "Briefing Inovar"',
    timeLabel: "há 20 minutos",
  },
  {
    id: "a2",
    actorId: "mariana",
    type: "comment",
    description: 'comentou no projeto "Pleno"',
    timeLabel: "há 1 hora",
  },
  {
    id: "a3",
    actorId: "daniel",
    type: "approval",
    description: 'aprovou "Reel — Gestão"',
    timeLabel: "há 2 horas",
  },
  {
    id: "a4",
    actorId: "daniel",
    type: "payment",
    description: "Novo pagamento registrado",
    timeLabel: "há 3 horas",
  },
];
