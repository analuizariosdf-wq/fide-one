import type { Client } from "@/lib/types";
import { createNameCache } from "@/lib/name-cache";

// Bridges real Supabase clients (UUID ids) into the same lookup used by
// src/lib/breadcrumb.ts, so the "Clientes / <nome>" breadcrumb resolves
// correctly for real clients — same rationale as registerSupabaseTask in
// mock-data/tasks.ts and registerSupabaseContent in mock-data/contents.ts.
// Populated by src/lib/data/clients.ts whenever it loads a client. See
// src/lib/name-cache.ts for why this is observable, not a plain Map.
//
// The demo `clients` array this file held through Fase 5.1 was removed in
// Fase 5.8: Clientes has been REAL/SUPABASE since Fase 5.2, and every
// other module that could still reference a client (Projetos, Tarefas,
// Conteúdos, Calendário) is real too — nothing in the app can produce a
// mock client id like "inovar" anymore, so getClient() never reached that
// branch. Only the bridge below is load-bearing now.
export const supabaseClientCache = createNameCache<Pick<Client, "id" | "name">>();

export function registerSupabaseClient(client: Pick<Client, "id" | "name">): void {
  supabaseClientCache.register(client);
}

export function getClient(id: string | null): Client | undefined {
  return id ? (supabaseClientCache.get(id) as Client | undefined) : undefined;
}
