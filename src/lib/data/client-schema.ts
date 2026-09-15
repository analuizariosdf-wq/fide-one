import { z } from "zod";

/**
 * Validates client input before it ever reaches Supabase. RLS still
 * enforces tenant isolation in the database regardless, but this catches
 * malformed data (and gives a understandable message) before a network
 * round-trip.
 */
export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente."),
  tradeName: z.string().trim().optional(),
  cnpj: z.string().trim().optional(),
  segment: z.string().trim().min(1, "Informe o segmento do cliente."),
  website: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  responsibleId: z.string().uuid("Selecione um responsável válido."),
  services: z.array(z.string()),
  startDate: z.string().refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Data de início inválida.",
  }),
  status: z.enum(["lead", "ativo", "pausado", "encerrado"]),
  monthlyFee: z.number().min(0, "A mensalidade não pode ser negativa."),
  dueDay: z.number().int().min(1).max(31),
  paymentMethod: z.string().trim(),
  notes: z.string().trim().optional(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
