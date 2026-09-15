"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Task, TaskUrgency, TaskWorkflowStatus } from "@/lib/types";
import { tasksStore } from "@/lib/store/tasks-store";
import { MOCK_TODAY, isOverdue } from "@/lib/format";

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
  const diffDays = Math.round(
    (due.getTime() - MOCK_TODAY.getTime()) / 86_400_000,
  );
  return diffDays >= 0 && diffDays <= 7;
}

export function filterTasks(items: Task[], filters: TaskFilters): Task[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search)) return false;
    if (filters.clientId && filters.clientId !== "todos" && task.clientId !== filters.clientId) {
      return false;
    }
    if (
      filters.projectId &&
      filters.projectId !== "todos" &&
      task.projectId !== filters.projectId
    ) {
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

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useTasks(filters: TaskFilters = {}): Task[] {
  const items = useSyncExternalStore(
    tasksStore.subscribe,
    tasksStore.getSnapshot,
    tasksStore.getSnapshot,
  );

  return useMemo(() => filterTasks(items, filters), [items, filters]);
}

export function useTask(id: string): Task | undefined {
  const items = useSyncExternalStore(
    tasksStore.subscribe,
    tasksStore.getSnapshot,
    tasksStore.getSnapshot,
  );

  return useMemo(() => items.find((task) => task.id === id), [items, id]);
}

export function groupTasksByStatus(items: Task[]): Record<TaskWorkflowStatus, Task[]> {
  const groups: Record<TaskWorkflowStatus, Task[]> = {
    backlog: [],
    a_fazer: [],
    em_producao: [],
    em_revisao: [],
    aguardando_cliente: [],
    concluido: [],
  };

  for (const task of items) {
    groups[task.status].push(task);
  }

  return groups;
}

export type TaskInput = Omit<Task, "id" | "comments" | "history">;

export function createTask(input: TaskInput): Task {
  const task: Task = {
    id: crypto.randomUUID(),
    ...input,
    history: [
      {
        id: crypto.randomUUID(),
        actorId: input.assigneeId,
        description: "criou a tarefa",
        timeLabel: "agora",
      },
    ],
  };
  return tasksStore.create(task);
}

export function updateTask(id: string, patch: Partial<Task>): Task | undefined {
  return tasksStore.update(id, patch);
}

export function removeTask(id: string): void {
  tasksStore.remove(id);
}
