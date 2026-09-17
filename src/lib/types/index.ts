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
  | "concluido"
  | "cancelado";

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

/**
 * Full editorial content model for the Conteúdos module. Distinct from
 * `ContentItem` above (Etapa 1), which backs the Dashboard's "Próximas
 * publicações" widget and the client-detail KPIs — kept untouched, same
 * rationale as `Task` vs `TaskItem`.
 *
 * Content is not a task: it's the editorial object a set of tasks
 * (`taskIds`) works towards publishing.
 */
export type ContentEditorialStatus =
  | "ideia"
  | "briefing"
  | "copy"
  | "design"
  | "revisao"
  | "aprovacao"
  | "agendado"
  | "publicado";

export type ContentType =
  | "Post"
  | "Carrossel"
  | "Reels"
  | "Story"
  | "Vídeo"
  | "Artigo"
  | "Blog"
  | "LinkedIn"
  | "Anúncio";

export type ContentChannel =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube"
  | "Site"
  | "Google";

export interface Content {
  id: string;
  title: string;
  clientId: string;
  projectId: string | null;
  contentType: ContentType;
  channel: ContentChannel;
  status: ContentEditorialStatus;
  responsibleId: string;
  publishDate: string;
  publishTime?: string;
  description?: string;
  caption?: string;
  cta?: string;
  /** Set only once the content actually reaches "publicado" — see the
   * publication-rule note in src/lib/data/contents.ts. Distinct from
   * publishDate/publishTime, which are the planned schedule. */
  publishedAt?: string;
  taskIds: string[];
}

/**
 * Standalone calendar entries that aren't a Content publication or a
 * Task deadline — meetings, generic events, or explicit deadlines. No
 * dedicated module backs these yet; they exist purely so the calendar
 * can visually represent the full operational picture.
 */
export type CalendarEventType = "reuniao" | "evento" | "deadline";

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  clientId?: string | null;
  description?: string;
}

/** Type discriminator used by the unified calendar rendering. */
export type CalendarItemKind = "publicacao" | "tarefa" | CalendarEventType;

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  date: string;
  time?: string;
  clientId?: string | null;
  href?: string;
  sourceEvent?: CalendarEvent;
}
