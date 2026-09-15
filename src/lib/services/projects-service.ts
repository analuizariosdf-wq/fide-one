"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Project, ProjectStatus } from "@/lib/types";
import { projectsStore } from "@/lib/store/projects-store";

export interface ProjectFilters {
  search?: string;
  clientId?: string | "todos";
  responsibleId?: string | "todos";
  status?: ProjectStatus | "todos";
}

export function filterProjects(items: Project[], filters: ProjectFilters): Project[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((project) => {
    if (search && !project.name.toLowerCase().includes(search)) return false;
    if (filters.clientId && filters.clientId !== "todos" && project.clientId !== filters.clientId) {
      return false;
    }
    if (
      filters.responsibleId &&
      filters.responsibleId !== "todos" &&
      project.responsibleId !== filters.responsibleId
    ) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && project.status !== filters.status) {
      return false;
    }
    return true;
  });
}

export function useProjects(filters: ProjectFilters = {}): Project[] {
  const items = useSyncExternalStore(
    projectsStore.subscribe,
    projectsStore.getSnapshot,
    projectsStore.getSnapshot,
  );

  return useMemo(() => filterProjects(items, filters), [items, filters]);
}

export function useProject(id: string): Project | undefined {
  const items = useSyncExternalStore(
    projectsStore.subscribe,
    projectsStore.getSnapshot,
    projectsStore.getSnapshot,
  );

  return useMemo(() => items.find((project) => project.id === id), [items, id]);
}

export function useProjectsByClient(clientId: string): Project[] {
  return useProjects({ clientId });
}

export type ProjectInput = Omit<Project, "id">;

export function createProject(input: ProjectInput): Project {
  const project: Project = { id: crypto.randomUUID(), ...input };
  return projectsStore.create(project);
}

export function updateProject(id: string, patch: Partial<ProjectInput>): Project | undefined {
  return projectsStore.update(id, patch);
}

export function removeProject(id: string): void {
  projectsStore.remove(id);
}
