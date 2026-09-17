import { z } from "zod";

import { CHANNEL_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/lib/mock-data/contents";
import type { ContentChannel, ContentType } from "@/lib/types";

/**
 * Validates content input before it ever reaches Supabase. RLS still
 * enforces tenant isolation in the database regardless, but this catches
 * malformed data (and gives an understandable message) before a network
 * round-trip. Cross-entity ownership (cliente/projeto/responsável actually
 * belonging to the caller's organization) is checked separately in
 * src/lib/data/contents.ts — a UUID shape alone doesn't prove that.
 *
 * content_type/channel reuse CONTENT_TYPE_OPTIONS/CHANNEL_OPTIONS from
 * mock-data/contents.ts on purpose — those two arrays are the domain
 * vocabulary (matches the schema's check constraints exactly), not mock
 * entity rows, so they stay the single source of truth for both the real
 * and still-mocked call sites instead of being duplicated here.
 */
export const contentInputSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do conteúdo."),
  clientId: z.string().uuid("Selecione um cliente válido."),
  projectId: z.string().uuid("Projeto inválido.").nullable(),
  contentType: z.enum(CONTENT_TYPE_OPTIONS as [ContentType, ...ContentType[]]),
  channel: z.enum(CHANNEL_OPTIONS as [ContentChannel, ...ContentChannel[]]),
  status: z.enum([
    "ideia",
    "briefing",
    "copy",
    "design",
    "revisao",
    "aprovacao",
    "agendado",
    "publicado",
  ]),
  responsibleId: z.string().uuid("Responsável inválido.").nullable(),
  publishDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe uma data de publicação válida.",
  }),
  publishTime: z.string().optional(),
  description: z.string().trim().optional(),
  caption: z.string().trim().optional(),
  cta: z.string().trim().optional(),
  taskIds: z.array(z.string().uuid()),
});

export type ContentInput = z.infer<typeof contentInputSchema>;
