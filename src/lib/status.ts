import type {
  CalendarEventType,
  ClientStatus,
  ContentEditorialStatus,
  FinancialCategoryType,
  FinancialTransactionStatus,
  ProjectStatus,
  TaskUrgency,
  TaskWorkflowStatus,
} from "@/lib/types";

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
  cancelado: { label: "Cancelado", variant: "danger" },
};

export const taskWorkflowOrder: TaskWorkflowStatus[] = [
  "backlog",
  "a_fazer",
  "em_producao",
  "em_revisao",
  "aguardando_cliente",
  "concluido",
  "cancelado",
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

/** 8-stage editorial flow for the Conteúdos module (`Content` type). */
export const contentEditorialConfig: Record<
  ContentEditorialStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  ideia: { label: "Ideia", variant: "neutral" },
  briefing: { label: "Briefing", variant: "neutral" },
  copy: { label: "Copy", variant: "neutral" },
  design: { label: "Design", variant: "info" },
  revisao: { label: "Revisão", variant: "warning" },
  aprovacao: { label: "Aprovação", variant: "warning" },
  agendado: { label: "Agendado", variant: "info" },
  publicado: { label: "Publicado", variant: "success" },
};

export const contentEditorialOrder: ContentEditorialStatus[] = [
  "ideia",
  "briefing",
  "copy",
  "design",
  "revisao",
  "aprovacao",
  "agendado",
  "publicado",
];

export const financialCategoryTypeConfig: Record<
  FinancialCategoryType,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  receita: { label: "Receita", variant: "success" },
  despesa: { label: "Despesa", variant: "danger" },
};

/** "atrasado" is only ever shown here computed at render time — see isTransactionOverdue(). */
export const financialTransactionStatusConfig: Record<
  FinancialTransactionStatus,
  { label: string; variant: "info" | "success" | "warning" | "neutral" | "danger" }
> = {
  previsto: { label: "Previsto", variant: "neutral" },
  proximo: { label: "Próximo", variant: "warning" },
  pago: { label: "Pago", variant: "success" },
  atrasado: { label: "Atrasado", variant: "danger" },
};

export const calendarEventTypeConfig: Record<
  CalendarEventType,
  { label: string; dotClass: string }
> = {
  reuniao: { label: "Reunião", dotClass: "bg-status-info-dot" },
  evento: { label: "Evento", dotClass: "bg-status-neutral-dot" },
  deadline: { label: "Deadline", dotClass: "bg-status-danger-dot" },
};

/** Extends `calendarEventTypeConfig` with the two entity-backed kinds. */
export const calendarItemKindConfig: Record<
  "publicacao" | "tarefa" | CalendarEventType,
  { label: string; dotClass: string }
> = {
  publicacao: { label: "Publicação", dotClass: "bg-primary" },
  tarefa: { label: "Tarefa", dotClass: "bg-status-warning-dot" },
  ...calendarEventTypeConfig,
};
