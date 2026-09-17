import { z } from "zod";

/**
 * Validates calendar_event input before it ever reaches Supabase. RLS
 * still enforces tenant isolation regardless; this catches malformed data
 * before a network round-trip. Only the 3 manually-creatable types are
 * accepted here — see src/lib/data/calendar.ts for why "publication"/"task"
 * (the schema's other 2 CHECK values) are legacy and never written by
 * this app going forward.
 */
export const calendarEventInputSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do evento."),
  type: z.enum(["reuniao", "evento", "deadline"]),
  clientId: z.string().uuid("Cliente inválido.").nullable(),
  projectId: z.string().uuid("Projeto inválido.").nullable(),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe uma data válida.",
  }),
  time: z.string().optional(),
  description: z.string().trim().optional(),
});

export type CalendarEventInput = z.infer<typeof calendarEventInputSchema>;
