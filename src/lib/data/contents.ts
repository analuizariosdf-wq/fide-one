"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { registerSupabaseProfile } from "@/lib/mock-data/team";
import { registerSupabaseContent } from "@/lib/mock-data/contents";
import { toInitials } from "@/lib/utils";
import { toHoursMinutes } from "@/lib/format";
import type {
  Content,
  ContentChannel,
  ContentEditorialStatus,
  ContentType,
  TaskWorkflowStatus,
} from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import { contentInputSchema, type ContentInput } from "@/lib/data/content-schema";
import { getCurrentOrganizationId } from "@/lib/data/organization";

export type { ContentInput };

export interface ClientOption {
  id: string;
  name: string;
}

export interface ProjectOption {
  id: string;
  name: string;
  clientId: string;
}

export interface ProfileOption {
  id: string;
  name: string;
}

export interface ContentFilters {
  search?: string;
  clientId?: string | "todos";
  projectId?: string | "todos";
  channel?: ContentChannel | "todos";
  contentType?: ContentType | "todos";
  responsibleId?: string | "todos";
  status?: ContentEditorialStatus | "todos";
  dateFrom?: string;
  dateTo?: string;
}

export function filterContents(items: Content[], filters: ContentFilters): Content[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((content) => {
    if (search && !content.title.toLowerCase().includes(search)) return false;
    if (filters.clientId && filters.clientId !== "todos" && content.clientId !== filters.clientId) {
      return false;
    }
    if (
      filters.projectId &&
      filters.projectId !== "todos" &&
      content.projectId !== filters.projectId
    ) {
      return false;
    }
    if (filters.channel && filters.channel !== "todos" && content.channel !== filters.channel) {
      return false;
    }
    if (
      filters.contentType &&
      filters.contentType !== "todos" &&
      content.contentType !== filters.contentType
    ) {
      return false;
    }
    if (
      filters.responsibleId &&
      filters.responsibleId !== "todos" &&
      content.responsibleId !== filters.responsibleId
    ) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && content.status !== filters.status) {
      return false;
    }
    if (filters.dateFrom && content.publishDate < filters.dateFrom) return false;
    if (filters.dateTo && content.publishDate > filters.dateTo) return false;

    return true;
  });
}

function mapContent(row: Tables<"contents">, taskIdsByContentId: Map<string, string[]>): Content {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    projectId: row.project_id,
    contentType: row.content_type,
    channel: row.channel,
    status: row.status,
    responsibleId: row.responsible_id ?? "",
    publishDate: row.scheduled_date ?? "",
    publishTime: toHoursMinutes(row.scheduled_time),
    description: row.description ?? undefined,
    caption: row.caption ?? undefined,
    cta: row.cta ?? undefined,
    publishedAt: row.published_at ?? undefined,
    taskIds: taskIdsByContentId.get(row.id) ?? [],
  };
}

interface LoadedData {
  contents: Content[];
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
}

/**
 * Same flat-queries-joined-in-JS approach as clients.ts/projects.ts/tasks.ts
 * — no PostgREST embedded selects. content_tasks is loaded once for every
 * content in the organization (not per-content) to avoid N+1.
 */
async function loadContentsData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();

  const [contentsRes, clientsRes, projectsRes, profilesRes, contentTasksRes] = await Promise.all([
    supabase.from("contents").select("*").order("scheduled_date"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase.from("profiles").select("id, name"),
    supabase.from("content_tasks").select("content_id, task_id"),
  ]);

  if (contentsRes.error) throw contentsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (contentTasksRes.error) throw contentTasksRes.error;

  const profiles = profilesRes.data ?? [];
  for (const profile of profiles) {
    registerSupabaseProfile({
      id: profile.id,
      name: profile.name,
      initials: toInitials(profile.name),
      role: "",
    });
  }

  const taskIdsByContentId = new Map<string, string[]>();
  for (const link of contentTasksRes.data ?? []) {
    const list = taskIdsByContentId.get(link.content_id) ?? [];
    list.push(link.task_id);
    taskIdsByContentId.set(link.content_id, list);
  }

  const contents = (contentsRes.data ?? []).map((row) => mapContent(row, taskIdsByContentId));
  for (const content of contents) {
    registerSupabaseContent({ id: content.id, title: content.title });
  }

  return {
    contents,
    clients: clientsRes.data ?? [],
    projects: (projectsRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      clientId: row.client_id,
    })),
    profiles,
  };
}

export function useContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadContentsData();
      setContents(data.contents);
      setClients(data.clients);
      setProjects(data.projects);
      setProfiles(data.profiles);
    } catch {
      setError("Não foi possível carregar os conteúdos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadContentsData()
      .then((data) => {
        if (!active) return;
        setContents(data.contents);
        setClients(data.clients);
        setProjects(data.projects);
        setProfiles(data.profiles);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os conteúdos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { contents, clients, projects, profiles, loading, error, refetch };
}

export function useContent(id: string) {
  const { contents, clients, projects, profiles, loading, error, refetch } = useContents();
  return {
    content: contents.find((content) => content.id === id),
    clients,
    projects,
    profiles,
    loading,
    error,
    refetch,
  };
}

/**
 * Same reasoning as the equivalent asserts in src/lib/data/tasks.ts: the
 * dropdowns already only offer options loaded under RLS, but nothing stops
 * a crafted request from sending a UUID the frontend never offered.
 */
async function assertClientBelongsToOrg(clientId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente inválido para esta organização.");
}

async function assertProfileBelongsToOrg(profileId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("id").eq("id", profileId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Responsável inválido para esta organização.");
}

async function assertProjectBelongsToOrg(projectId: string, clientId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Projeto inválido para esta organização.");
  if (data.client_id !== clientId) {
    throw new Error("O projeto selecionado não pertence ao cliente informado.");
  }
}

async function assertRelationships(input: ContentInput): Promise<void> {
  await assertClientBelongsToOrg(input.clientId);
  if (input.projectId) await assertProjectBelongsToOrg(input.projectId, input.clientId);
  if (input.responsibleId) await assertProfileBelongsToOrg(input.responsibleId);
}

/**
 * publication rule (documented per Fase 5.5): published_at only reflects an
 * actual transition into "publicado" — untouched on an edit that keeps the
 * content published, cleared the moment it leaves that status. Distinct
 * from scheduled_date/scheduled_time, which are the *planned* schedule and
 * are never touched by this function — same completed_at rule already
 * used for tasks in src/lib/data/tasks.ts.
 */
function resolvePublishedAt(
  previousStatus: ContentEditorialStatus | null,
  previousPublishedAt: string | null,
  nextStatus: ContentEditorialStatus,
): string | null {
  if (nextStatus !== "publicado") return null;
  return previousStatus === "publicado" ? previousPublishedAt : new Date().toISOString();
}

function toRowPayload(input: ContentInput, organizationId: string, publishedAt: string | null) {
  return {
    organization_id: organizationId,
    client_id: input.clientId,
    project_id: input.projectId,
    title: input.title,
    content_type: input.contentType,
    channel: input.channel,
    status: input.status,
    responsible_id: input.responsibleId,
    scheduled_date: input.publishDate || null,
    scheduled_time: input.publishTime || null,
    description: input.description || null,
    caption: input.caption || null,
    cta: input.cta || null,
    published_at: publishedAt,
  };
}

async function syncContentTasks(contentId: string, organizationId: string, taskIds: string[]) {
  const supabase = createSupabaseClient();

  const { error: deleteError } = await supabase
    .from("content_tasks")
    .delete()
    .eq("content_id", contentId);
  if (deleteError) throw deleteError;

  if (taskIds.length === 0) return;

  const { error: insertError } = await supabase.from("content_tasks").insert(
    taskIds.map((taskId) => ({
      organization_id: organizationId,
      content_id: contentId,
      task_id: taskId,
    })),
  );
  if (insertError) throw insertError;
}

export async function createContent(rawInput: ContentInput): Promise<Content> {
  const input = contentInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publishedAt = resolvePublishedAt(null, null, input.status);

  const { data, error } = await supabase
    .from("contents")
    .insert({ ...toRowPayload(input, organizationId, publishedAt), created_by: user?.id ?? null })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar conteúdo.");

  await syncContentTasks(data.id, organizationId, input.taskIds);

  return mapContent(data, new Map([[data.id, input.taskIds]]));
}

/**
 * Status-only move (Client Workspace Kanban drag-and-drop) — skips the
 * full ContentInput validation updateContent requires, same reasoning as
 * updateTaskStatus for Tasks.
 */
export async function updateContentStatus(id: string, status: ContentEditorialStatus): Promise<Content> {
  const supabase = createSupabaseClient();

  const { data: current, error: currentError } = await supabase
    .from("contents")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error("Conteúdo não encontrado.");

  const publishedAt = resolvePublishedAt(current.status, current.published_at, status);

  const { data, error } = await supabase
    .from("contents")
    .update({ status, published_at: publishedAt })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao mover o conteúdo.");

  return mapContent(data, new Map());
}

export async function updateContent(id: string, rawInput: ContentInput): Promise<Content> {
  const input = contentInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data: current, error: currentError } = await supabase
    .from("contents")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error("Conteúdo não encontrado.");

  const publishedAt = resolvePublishedAt(current.status, current.published_at, input.status);

  const { data, error } = await supabase
    .from("contents")
    .update(toRowPayload(input, organizationId, publishedAt))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar conteúdo.");

  await syncContentTasks(id, organizationId, input.taskIds);

  return mapContent(data, new Map([[id, input.taskIds]]));
}

export async function removeContent(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) throw error;
}

export interface ContentRelatedTask {
  id: string;
  title: string;
  status: TaskWorkflowStatus;
  assigneeId: string;
  dueDate: string;
}

/** Task fields needed by ContentTasksChecklist — not the full Task shape. */
async function loadContentRelatedTasks(taskIds: string[]): Promise<ContentRelatedTask[]> {
  if (taskIds.length === 0) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, assignee_id, due_date")
    .in("id", taskIds);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    assigneeId: row.assignee_id ?? "",
    dueDate: row.due_date ?? "",
  }));
}

export function useContentRelatedTasks(taskIds: string[]) {
  const key = taskIds.join(",");
  const [tasks, setTasks] = useState<ContentRelatedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await loadContentRelatedTasks(taskIds));
    } catch {
      setError("Não foi possível carregar as tarefas relacionadas. Tente novamente.");
    } finally {
      setLoading(false);
    }
    // taskIds is intentionally reduced to `key` below — a new array
    // instance on every render would otherwise retrigger this forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let active = true;

    loadContentRelatedTasks(taskIds)
      .then((data) => {
        if (active) setTasks(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar as tarefas relacionadas. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { tasks, loading, error, refetch };
}

export interface TaskRelatedContent {
  id: string;
  title: string;
  contentType: ContentType;
  channel: ContentChannel;
  status: ContentEditorialStatus;
}

async function loadTaskRelatedContents(taskId: string): Promise<TaskRelatedContent[]> {
  const supabase = createSupabaseClient();

  const { data: links, error: linksError } = await supabase
    .from("content_tasks")
    .select("content_id")
    .eq("task_id", taskId);
  if (linksError) throw linksError;

  const contentIds = (links ?? []).map((link) => link.content_id);
  if (contentIds.length === 0) return [];

  const { data, error } = await supabase
    .from("contents")
    .select("id, title, content_type, channel, status")
    .in("id", contentIds);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    channel: row.channel,
    status: row.status,
  }));
}

/** Backs the Tarefa detail page's "Conteúdo relacionado" card (Fase 5.5). */
export function useTaskRelatedContents(taskId: string) {
  const [contents, setContents] = useState<TaskRelatedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContents(await loadTaskRelatedContents(taskId));
    } catch {
      setError("Não foi possível carregar os conteúdos relacionados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    let active = true;

    loadTaskRelatedContents(taskId)
      .then((data) => {
        if (active) setContents(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os conteúdos relacionados. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  return { contents, loading, error, refetch };
}
