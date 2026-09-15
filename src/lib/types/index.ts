export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  segment: string;
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
