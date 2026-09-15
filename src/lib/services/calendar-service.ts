"use client";

import { useMemo, useSyncExternalStore } from "react";

import type {
  CalendarItem,
  CalendarItemKind,
  ContentChannel,
  ContentType,
} from "@/lib/types";
import type { Content, Task } from "@/lib/types";
import { calendarEvents } from "@/lib/mock-data/calendar";
import { contentsStore } from "@/lib/store/contents-store";
import { tasksStore } from "@/lib/store/tasks-store";

export interface CalendarFilters {
  clientId?: string | "todos";
  channel?: ContentChannel | "todos";
  contentType?: ContentType | "todos";
  responsibleId?: string | "todos";
  status?: string | "todos";
  kind?: CalendarItemKind | "todos";
}

function buildItems(contents: Content[], tasks: Task[]): CalendarItem[] {
  const contentItems: CalendarItem[] = contents.map((content) => ({
    id: `content-item-${content.id}`,
    kind: "publicacao",
    title: content.title,
    date: content.publishDate,
    time: content.publishTime,
    clientId: content.clientId,
    href: `/contents/${content.id}`,
  }));

  const taskItems: CalendarItem[] = tasks.map((task) => ({
    id: `task-item-${task.id}`,
    kind: "tarefa",
    title: task.title,
    date: task.dueDate,
    clientId: task.clientId,
    href: `/tasks/${task.id}`,
  }));

  const eventItems: CalendarItem[] = calendarEvents.map((event) => ({
    id: `event-item-${event.id}`,
    kind: event.type,
    title: event.title,
    date: event.date,
    time: event.time,
    clientId: event.clientId,
    sourceEvent: event,
  }));

  return [...contentItems, ...taskItems, ...eventItems];
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

export function useCalendarItems(filters: CalendarFilters = {}): CalendarItem[] {
  const contents = useSyncExternalStore(
    contentsStore.subscribe,
    contentsStore.getSnapshot,
    contentsStore.getSnapshot,
  );
  const tasks = useSyncExternalStore(
    tasksStore.subscribe,
    tasksStore.getSnapshot,
    tasksStore.getSnapshot,
  );

  return useMemo(() => {
    const contentById = new Map(contents.map((content) => [content.id, content]));
    return buildItems(contents, tasks).filter((item) =>
      matchesFilters(item, filters, contentById),
    );
  }, [contents, tasks, filters]);
}
