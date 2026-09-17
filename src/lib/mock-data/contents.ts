import type { Content, ContentChannel, ContentType } from "@/lib/types";
import { createNameCache } from "@/lib/name-cache";

/**
 * Domain vocabulary, not mock entity data — matches the `content_type`/
 * `channel` CHECK constraints on the real `contents` table exactly (see
 * src/lib/data/content-schema.ts). Kept here and reused by the real
 * Conteúdos module and by the Calendário filters as the single source of
 * truth for these two enums, instead of duplicating the list elsewhere.
 */
export const CONTENT_TYPE_OPTIONS: ContentType[] = [
  "Post",
  "Carrossel",
  "Reels",
  "Story",
  "Vídeo",
  "Artigo",
  "Blog",
  "LinkedIn",
  "Anúncio",
];

export const CHANNEL_OPTIONS: ContentChannel[] = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "Site",
  "Google",
];

// Bridges real Supabase contents (UUID ids) into the same lookup used by
// src/lib/breadcrumb.ts, so the "Conteúdos / <título>" breadcrumb resolves
// correctly for real contents — same rationale as registerSupabaseTask in
// mock-data/tasks.ts. Populated by src/lib/data/contents.ts whenever it
// loads a content. See src/lib/name-cache.ts for why this is observable.
//
// The demo `contents`/`editorialContents` arrays and
// getContentsByClient()/getContentsByProject() this file held through
// Fase 5.4 were removed in Fase 5.8: Conteúdos has been REAL/SUPABASE
// since Fase 5.5, and Calendário/Dashboard (its former consumers) are
// real too — nothing in the app can produce a mock content id anymore.
// Only the bridge and the two option lists above are load-bearing now.
export const supabaseContentCache = createNameCache<Pick<Content, "id" | "title">>();

export function registerSupabaseContent(content: Pick<Content, "id" | "title">): void {
  supabaseContentCache.register(content);
}

export function getContent(id: string): Content | undefined {
  return supabaseContentCache.get(id) as Content | undefined;
}
