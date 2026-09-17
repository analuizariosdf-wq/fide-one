import { z } from "zod";

/**
 * Validates task input before it ever reaches Supabase. RLS still enforces
 * tenant isolation in the database regardless, but this catches malformed
 * data (and gives an understandable message) before a network round-trip.
 * Cross-entity ownership (cliente/projeto/responsável actually belonging to
 * the caller's organization) is checked separately in src/lib/data/tasks.ts
 * — a UUID shape alone doesn't prove that.
 */
export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da tarefa."),
  description: z.string().trim().optional(),
  clientId: z.string().uuid("Cliente inválido.").nullable(),
  projectId: z.string().uuid("Projeto inválido.").nullable(),
  assigneeId: z.string().uuid("Responsável inválido.").nullable(),
  priority: z.enum(["baixa", "normal", "alta", "urgente"]),
  status: z.enum([
    "backlog",
    "a_fazer",
    "em_producao",
    "em_revisao",
    "aguardando_cliente",
    "concluido",
    "cancelado",
  ]),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Informe um prazo válido para a tarefa.",
  }),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
