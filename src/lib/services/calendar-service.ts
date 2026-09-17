"use client";

import { useCallback, useMemo } from "react";

import type {
  CalendarItem,
  CalendarItemKind,
  ContentChannel,
  ContentType,
} from "@/lib/types";
import type { Content, Task } from "@/lib/types";
import { useContents } from "@/lib/data/contents";
import { useTasks } from "@/lib/data/tasks";
import { useCalendarEvents } from "@/lib/data/calendar";

export interface CalendarFilters {
  clientId?: string | "todos";
  projectId?: string | "todos";
  channel?: ContentChannel | "todos";
  contentType?: ContentType | "todos";
  responsibleId?: string | "todos";
  status?: string | "todos";
  kind?: CalendarItemKind | "todos";
}

/**
 * The calendar is a projection over 3 real sources, never a copy: a
 * content with scheduled_date/scheduled_time IS a calendar item (no
 * calendar_events row is ever created for it), same for a task's
 * due_date. Only genuinely standalone entries (reunião, evento, prazo
 * manual) live in calendar_events. Editing the content/task elsewhere
 * updates what the calendar shows automatically — there is nothing to
 * keep in sync.
 */
function buildItems(contents: Content[], tasks: Task[], events: CalendarItem[]): CalendarItem[] {
  const contentItems: CalendarItem[] = contents
    .filter((content) => content.publishDate)
    .map((content) => ({
      id: `content-item-${content.id}`,
      kind: "publicacao",
      title: content.title,
      date: content.publishDate,
      time: content.publishTime,
      clientId: content.clientId,
      projectId: content.projectId,
      href: `/contents/${content.id}`,
    }));

  const taskItems: CalendarItem[] = tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: `task-item-${task.id}`,
      kind: "tarefa",
      title: task.title,
      date: task.dueDate,
      clientId: task.clientId,
      projectId: task.projectId,
      href: `/tasks/${task.id}`,
    }));

  return [...contentItems, ...taskItems, ...events];
}

function matchesFilters(
  item: CalendarItem,
  filters: CalendarFilters,
  contentById: Map<string, Content>,
): boolean {
  if (filters.kind && filters.kind !== "todos" && item.kind !== filters.kind) return false;
  if (filters.clientId && filters.clientId !== "todos" && item.clientId !== filters.clientId) {
    return false;
  }
  if (filters.projectId && filters.projectId !== "todos" && item.projectId !== filters.projectId) {
    return false;
  }

  if (item.kind === "publicacao") {
    const content = contentById.get(item.id.replace("content-item-", ""));
    if (!content) return false;
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
  } else if (
    (filters.channel && filters.channel !== "todos") ||
    (filters.contentType && filters.contentType !== "todos") ||
    (filters.status && filters.status !== "todos")
  ) {
    // Canal/Formato/Status só existem em conteúdos — outros tipos de item
    // ficam de fora quando um desses filtros está ativo.
    return false;
  }

  return true;
}

export function useCalendarItems(filters: CalendarFilters = {}) {
  const {
    contents,
    clients,
    projects,
    profiles,
    loading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useContents();
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useCalendarEvents();

  const loading = contentsLoading || tasksLoading || eventsLoading;
  const error = contentsError ?? tasksError ?? eventsError;

  const refetch = useCallback(() => {
    refetchContents();
    refetchTasks();
    refetchEvents();
  }, [refetchContents, refetchTasks, refetchEvents]);

  const items = useMemo(() => {
    const contentById = new Map(contents.map((content) => [content.id, content]));
    return buildItems(contents, tasks, events).filter((item) =>
      matchesFilters(item, filters, contentById),
    );
  }, [contents, tasks, events, filters]);

  return { items, clients, projects, profiles, loading, error, refetch };
}
