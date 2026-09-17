import type { Task } from "@/lib/types";
import { createNameCache } from "@/lib/name-cache";

// Bridges real Supabase tasks (UUID ids) into the same lookup used by
// src/lib/breadcrumb.ts, so the "Tarefas / <título>" breadcrumb resolves
// correctly for real tasks — same rationale as registerSupabaseProfile in
// mock-data/team.ts. Populated by src/lib/data/tasks.ts whenever it loads
// a task. See src/lib/name-cache.ts for why this is observable.
//
// The demo `tasks` array and getTasksByClient()/getTasksByProject() this
// file held through Fase 5.3 were removed in Fase 5.8: Tarefas has been
// REAL/SUPABASE since Fase 5.4, and Conteúdos/Calendário (its only former
// consumers) are real too — nothing in the app can produce a mock task id
// anymore. Only the bridge below is load-bearing now.
export const supabaseTaskCache = createNameCache<Pick<Task, "id" | "title">>();

export function registerSupabaseTask(task: Pick<Task, "id" | "title">): void {
  supabaseTaskCache.register(task);
}

export function getTask(id: string): Task | undefined {
  return supabaseTaskCache.get(id) as Task | undefined;
}
