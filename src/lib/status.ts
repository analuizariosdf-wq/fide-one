import type {
  ClientStatus,
  ContentStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  TaskUrgency,
  TaskWorkflowStatus,
} from "@/lib/types";

export const contentStatusConfig: Record<
  ContentStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" }
> = {
  aprovacao: { label: "Aprovação", variant: "warning" },
  agendado: { label: "Agendado", variant: "info" },
  producao: { label: "Em produção", variant: "neutral" },
  revisao: { label: "Revisão", variant: "warning" },
  publicado: { label: "Publicado", variant: "success" },
};

/** Backs the Dashboard's "Minhas tarefas" widget (Etapa 1, approved). */
export const taskStatusConfig: Record<
  TaskStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  pendente: { label: "Pendente", variant: "neutral" },
  em_andamento: { label: "Em andamento", variant: "info" },
  concluida: { label: "Concluída", variant: "success" },
  atrasada: { label: "Atrasada", variant: "danger" },
};

export const taskPriorityConfig: Record<
  TaskPriority,
  { label: string; dotClass: string }
> = {
  alta: { label: "Alta", dotClass: "bg-status-danger-dot" },
  media: { label: "Média", dotClass: "bg-status-warning-dot" },
  baixa: { label: "Baixa", dotClass: "bg-status-neutral-dot" },
};

export const clientStatusConfig: Record<
  ClientStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  lead: { label: "Lead", variant: "info" },
  ativo: { label: "Ativo", variant: "success" },
  pausado: { label: "Pausado", variant: "warning" },
  encerrado: { label: "Encerrado", variant: "danger" },
};

export const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  planejamento: { label: "Planejamento", variant: "neutral" },
  em_andamento: { label: "Em andamento", variant: "info" },
  em_pausa: { label: "Em pausa", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
  cancelado: { label: "Cancelado", variant: "danger" },
};

/** Kanban / workflow status for the full Tarefas module (`Task` type). */
export const taskWorkflowConfig: Record<
  TaskWorkflowStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  backlog: { label: "Backlog", variant: "neutral" },
  a_fazer: { label: "A fazer", variant: "neutral" },
  em_producao: { label: "Em produção", variant: "info" },
  em_revisao: { label: "Em revisão", variant: "warning" },
  aguardando_cliente: { label: "Aguardando cliente", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
};

export const taskWorkflowOrder: TaskWorkflowStatus[] = [
  "backlog",
  "a_fazer",
  "em_producao",
  "em_revisao",
  "aguardando_cliente",
  "concluido",
];

export const taskUrgencyConfig: Record<
  TaskUrgency,
  { label: string; dotClass: string }
> = {
  baixa: { label: "Baixa", dotClass: "bg-status-neutral-dot" },
  normal: { label: "Normal", dotClass: "bg-status-info-dot" },
  alta: { label: "Alta", dotClass: "bg-status-warning-dot" },
  urgente: { label: "Urgente", dotClass: "bg-status-danger-dot" },
};
