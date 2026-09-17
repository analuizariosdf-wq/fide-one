import { z } from "zod";

/**
 * Validates project input before it ever reaches Supabase. RLS still
 * enforces tenant isolation in the database regardless, but this catches
 * malformed data (and gives an understandable message) before a network
 * round-trip.
 */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do projeto."),
  clientId: z.string().uuid("Selecione um cliente válido."),
  campaign: z.string().trim().optional(),
  description: z.string().trim().optional(),
  responsibleId: z.string().uuid("Selecione um responsável válido."),
  startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe a data inicial do projeto.",
  }),
  endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe a data final do projeto.",
  }),
  status: z.enum(["planejamento", "em_andamento", "em_pausa", "concluido", "cancelado"]),
  progress: z.number().int().min(0).max(100),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
