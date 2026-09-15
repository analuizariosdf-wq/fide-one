"use client";

import { useMemo, useSyncExternalStore } from "react";

import type {
  Content,
  ContentChannel,
  ContentEditorialStatus,
  ContentType,
} from "@/lib/types";
import { contentsStore } from "@/lib/store/contents-store";

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

export function useContents(filters: ContentFilters = {}): Content[] {
  const items = useSyncExternalStore(
    contentsStore.subscribe,
    contentsStore.getSnapshot,
    contentsStore.getSnapshot,
  );

  return useMemo(() => filterContents(items, filters), [items, filters]);
}

export function useContent(id: string): Content | undefined {
  const items = useSyncExternalStore(
    contentsStore.subscribe,
    contentsStore.getSnapshot,
    contentsStore.getSnapshot,
  );

  return useMemo(() => items.find((content) => content.id === id), [items, id]);
}

export type ContentInput = Omit<Content, "id">;

export function createContent(input: ContentInput): Content {
  const content: Content = { id: crypto.randomUUID(), ...input };
  return contentsStore.create(content);
}

export function updateContent(id: string, patch: Partial<ContentInput>): Content | undefined {
  return contentsStore.update(id, patch);
}

export function removeContent(id: string): void {
  contentsStore.remove(id);
}
