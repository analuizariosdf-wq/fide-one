"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { registerSupabaseProfile } from "@/lib/mock-data/team";
import { registerSupabaseTask } from "@/lib/mock-data/tasks";
import { toInitials } from "@/lib/utils";
import { MOCK_TODAY, isOverdue, toISODate } from "@/lib/format";
import { taskWorkflowOrder } from "@/lib/status";
import type { Task, TaskUrgency, TaskWorkflowStatus } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import { taskInputSchema, type TaskInput } from "@/lib/data/task-schema";
import { getCurrentOrganizationId } from "@/lib/data/organization";

export type { TaskInput };

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

export type TaskDueFilter = "todas" | "hoje" | "semana" | "atrasadas";

export interface TaskFilters {
  search?: string;
  clientId?: string | "todos";
  projectId?: string | "todos";
  assigneeId?: string | "todos";
  status?: TaskWorkflowStatus | "todos";
  priority?: TaskUrgency | "todos";
  due?: TaskDueFilter;
}

function isWithinWeek(dateISO: string): boolean {
  const due = new Date(`${dateISO}T00:00:00`);
  const diffDays = Math.round((due.getTime() - MOCK_TODAY.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= 7;
}

export function filterTasks(items: Task[], filters: TaskFilters): Task[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search)) return false;
    if (filters.clientId && filters.clientId !== "todos" && task.clientId !== filters.clientId) {
      return false;
    }
    if (filters.projectId && filters.projectId !== "todos" && task.projectId !== filters.projectId) {
      return false;
    }
    if (
      filters.assigneeId &&
      filters.assigneeId !== "todos" &&
      task.assigneeId !== filters.assigneeId
    ) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && task.status !== filters.status) {
      return false;
    }
    if (filters.priority && filters.priority !== "todos" && task.priority !== filters.priority) {
      return false;
    }
    if (filters.due === "hoje" && task.dueDate !== toISODate(MOCK_TODAY)) return false;
    if (filters.due === "semana" && !isWithinWeek(task.dueDate)) return false;
    if (filters.due === "atrasadas" && !isOverdue(task.dueDate)) return false;

    return true;
  });
}

export function groupTasksByStatus(items: Task[]): Record<TaskWorkflowStatus, Task[]> {
  const groups = Object.fromEntries(
    taskWorkflowOrder.map((status) => [status, [] as Task[]]),
  ) as Record<TaskWorkflowStatus, Task[]>;

  for (const task of items) {
    groups[task.status].push(task);
  }

  return groups;
}

function mapTask(row: Tables<"tasks">): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    clientId: row.client_id,
    projectId: row.project_id,
    assigneeId: row.assignee_id ?? "",
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ?? "",
  };
}

interface LoadedData {
  tasks: Task[];
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
}

/**
 * Same flat-queries-joined-in-JS approach as clients.ts/projects.ts — no
 * PostgREST embedded selects.
 */
async function loadTasksData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();

  const [tasksRes, clientsRes, projectsRes, profilesRes] = await Promise.all([
    supabase.from("tasks").select("*").order("due_date"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase.from("profiles").select("id, name"),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const profiles = profilesRes.data ?? [];
  for (const profile of profiles) {
    registerSupabaseProfile({
      id: profile.id,
      name: profile.name,
      initials: toInitials(profile.name),
      role: "",
    });
  }

  const tasks = (tasksRes.data ?? []).map(mapTask);
  for (const task of tasks) {
    registerSupabaseTask({ id: task.id, title: task.title });
  }

  return {
    tasks,
    clients: clientsRes.data ?? [],
    projects: (projectsRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      clientId: row.client_id,
    })),
    profiles,
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadTasksData();
      setTasks(data.tasks);
      setClients(data.clients);
      setProjects(data.projects);
      setProfiles(data.profiles);
    } catch {
      setError("Não foi possível carregar as tarefas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadTasksData()
      .then((data) => {
        if (!active) return;
        setTasks(data.tasks);
        setClients(data.clients);
        setProjects(data.projects);
        setProfiles(data.profiles);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar as tarefas. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { tasks, clients, projects, profiles, loading, error, refetch };
}

export function useTask(id: string) {
  const { tasks, clients, projects, profiles, loading, error, refetch } = useTasks();
  return {
    task: tasks.find((task) => task.id === id),
    clients,
    projects,
    profiles,
    loading,
    error,
    refetch,
  };
}

/**
 * The dropdowns already scope client/projeto/responsável to the caller's
 * organization (they're populated from RLS-filtered queries), but nothing
 * stops a crafted request from sending a UUID the frontend never offered.
 * These re-check each relationship server-side (RLS still applies to the
 * lookup itself) right before writing.
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

async function assertProjectBelongsToOrg(projectId: string, clientId: string | null): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Projeto inválido para esta organização.");
  if (clientId && data.client_id !== clientId) {
    throw new Error("O projeto selecionado não pertence ao cliente informado.");
  }
}

async function assertRelationships(input: TaskInput): Promise<void> {
  if (input.clientId) await assertClientBelongsToOrg(input.clientId);
  if (input.projectId) await assertProjectBelongsToOrg(input.projectId, input.clientId);
  if (input.assigneeId) await assertProfileBelongsToOrg(input.assigneeId);
}

/**
 * completed_at only reflects an actual transition into "concluido" — it's
 * left untouched on an edit that keeps the task concluded, and cleared the
 * moment a task leaves that status.
 */
function resolveCompletedAt(
  previousStatus: TaskWorkflowStatus | null,
  previousCompletedAt: string | null,
  nextStatus: TaskWorkflowStatus,
): string | null {
  if (nextStatus !== "concluido") return null;
  return previousStatus === "concluido" ? previousCompletedAt : new Date().toISOString();
}

function toRowPayload(input: TaskInput, organizationId: string, completedAt: string | null) {
  return {
    organization_id: organizationId,
    client_id: input.clientId,
    project_id: input.projectId,
    title: input.title,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    assignee_id: input.assigneeId,
    due_date: input.dueDate || null,
    completed_at: completedAt,
  };
}

export async function createTask(rawInput: TaskInput): Promise<Task> {
  const input = taskInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completedAt = resolveCompletedAt(null, null, input.status);

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...toRowPayload(input, organizationId, completedAt), creator_id: user?.id ?? null })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar tarefa.");

  return mapTask(data);
}

export async function updateTask(id: string, rawInput: TaskInput): Promise<Task> {
  const input = taskInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data: current, error: currentError } = await supabase
    .from("tasks")
    .select("status, completed_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error("Tarefa não encontrada.");

  const completedAt = resolveCompletedAt(current.status, current.completed_at, input.status);

  const { data, error } = await supabase
    .from("tasks")
    .update(toRowPayload(input, organizationId, completedAt))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar tarefa.");

  return mapTask(data);
}

/** Used by the Kanban's "mover para" action — status-only, no full form payload. */
export async function updateTaskStatus(id: string, status: TaskWorkflowStatus): Promise<Task> {
  const supabase = createSupabaseClient();

  const { data: current, error: currentError } = await supabase
    .from("tasks")
    .select("status, completed_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error("Tarefa não encontrada.");

  const completedAt = resolveCompletedAt(current.status, current.completed_at, status);

  const { data, error } = await supabase
    .from("tasks")
    .update({ status, completed_at: completedAt })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao mover a tarefa.");

  return mapTask(data);
}

export async function removeTask(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export interface TaskComment {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
}

async function loadTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("task_comments")
    .select("id, author_id, message, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id ?? "",
    message: row.message,
    createdAt: row.created_at,
  }));
}

export function useTaskComments(taskId: string) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setComments(await loadTaskComments(taskId));
    } catch {
      setError("Não foi possível carregar os comentários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    let active = true;

    loadTaskComments(taskId)
      .then((data) => {
        if (active) setComments(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os comentários. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  return { comments, loading, error, refetch };
}

export async function addTaskComment(taskId: string, message: string): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) return;

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("task_comments").insert({
    organization_id: organizationId,
    task_id: taskId,
    author_id: user.id,
    message: trimmed,
  });

  if (error) throw error;
}
