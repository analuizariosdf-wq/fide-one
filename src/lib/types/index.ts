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

/** Full task model for the Tarefas module (list, Kanban, detail). */
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
 * Full editorial content model for the Conteúdos module. Content is not
 * a task: it's the editorial object a set of tasks (`taskIds`) works
 * towards publishing.
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
  projectId?: string | null;
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
  projectId?: string | null;
  href?: string;
  sourceEvent?: CalendarEvent;
}
