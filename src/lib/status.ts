import type { ContentStatus, TaskPriority, TaskStatus } from "@/lib/types";

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
