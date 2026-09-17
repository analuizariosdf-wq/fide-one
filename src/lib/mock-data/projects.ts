import type { Project } from "@/lib/types";
import { createNameCache } from "@/lib/name-cache";

// Bridges real Supabase projects (UUID ids) into the same lookup used by
// src/lib/breadcrumb.ts — same rationale as registerSupabaseClient in
// mock-data/clients.ts. Populated by src/lib/data/projects.ts whenever it
// loads a project. See src/lib/name-cache.ts for why this is observable.
//
// The demo `projects` array and getProjectsByClient() this file held
// through Fase 5.2 were removed in Fase 5.8: Projetos has been
// REAL/SUPABASE since Fase 5.3, and every module that could reference a
// project (Tarefas, Conteúdos, Calendário) is real too — nothing in the
// app can produce a mock project id anymore. Only the bridge below is
// load-bearing now.
export const supabaseProjectCache = createNameCache<Pick<Project, "id" | "name">>();

export function registerSupabaseProject(project: Pick<Project, "id" | "name">): void {
  supabaseProjectCache.register(project);
}

export function getProject(id: string | null): Project | undefined {
  return id ? (supabaseProjectCache.get(id) as Project | undefined) : undefined;
}
