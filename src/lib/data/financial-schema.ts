import { z } from "zod";

/**
 * Validates transaction input before it reaches Supabase. RLS still
 * enforces tenant isolation regardless — this just catches malformed data
 * early. `categoryId` is required at this layer (even though the database
 * column is nullable) because receita/despesa is derived from the
 * category's `type`, never stored on the transaction itself — see
 * src/lib/data/financial.ts.
 */
export const financialTransactionInputSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do lançamento."),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  categoryId: z.string().uuid("Selecione uma categoria."),
  clientId: z.string().uuid("Cliente inválido.").nullable(),
  dueDate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Informe um vencimento válido.",
    }),
  status: z.enum(["previsto", "proximo", "pago", "atrasado"]),
  paidAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Informe uma data de pagamento válida.",
    }),
});

export type FinancialTransactionInput = z.infer<typeof financialTransactionInputSchema>;

export const financialCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria."),
  type: z.enum(["receita", "despesa"]),
});

export type FinancialCategoryInput = z.infer<typeof financialCategoryInputSchema>;
