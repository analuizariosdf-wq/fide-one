export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarUrl?: string;
}

export type ClientStatus = "lead" | "ativo" | "pausado" | "encerrado";

export interface Client {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  segment: string;
  website?: string;
  instagram?: string;
  email?: string;
  phone?: string;
  responsibleId: string;
  services: string[];
  startDate: string;
  status: ClientStatus;
  monthlyFee: number;
  dueDay: number;
  paymentMethod: string;
  notes?: string;
}

export type ContentStatus =
  | "aprovacao"
  | "agendado"
  | "producao"
  | "revisao"
  | "publicado";

export interface ContentItem {
  id: string;
  clientId: string;
  title: string;
  format: string;
  dueLabel: string;
  dueDate: string;
  responsibleId: string;
  status: ContentStatus;
}

export type TaskPriority = "alta" | "media" | "baixa";
export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "atrasada";

export interface TaskItem {
  id: string;
  title: string;
  clientId: string | null;
  dueLabel: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
}

export interface Payment {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  dueLabel: string;
  dueDate: string;
  status: "previsto" | "proximo" | "atrasado";
}

export type ActivityType =
  | "task_completed"
  | "comment"
  | "approval"
  | "payment";

export interface ActivityItem {
  id: string;
  actorId: string;
  type: ActivityType;
  description: string;
  timeLabel: string;
}

export type AttentionSeverity = "danger" | "warning";

export interface AttentionItem {
  id: string;
  label: string;
  severity: AttentionSeverity;
  href: string;
}

export type ProjectStatus =
  | "planejamento"
  | "em_andamento"
  | "em_pausa"
  | "concluido"
  | "cancelado";

export interface Project {
  id: string;
  name: string;
  clientId: string;
  campaign?: string;
  description?: string;
  responsibleId: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
}

/**
 * Full task model for the Tarefas module (list, Kanban, detail).
 * Distinct from `TaskItem` above, which backs the Dashboard's "Minhas
 * tarefas" widget from Etapa 1 — kept untouched so that approved screen
 * stays exactly as validated. The two can be unified in a later pass.
 */
export type TaskWorkflowStatus =
  | "backlog"
  | "a_fazer"
  | "em_producao"
  | "em_revisao"
  | "aguardando_cliente"
  | "concluido";

export type TaskUrgency = "baixa" | "normal" | "alta" | "urgente";

export interface Comment {
  id: string;
  authorId: string;
  message: string;
  timeLabel: string;
}

export interface HistoryEntry {
  id: string;
  actorId: string;
  description: string;
  timeLabel: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId: string | null;
  projectId: string | null;
  assigneeId: string;
  priority: TaskUrgency;
  status: TaskWorkflowStatus;
  dueDate: string;
  relatedContentId?: string | null;
  comments?: Comment[];
  history?: HistoryEntry[];
}
