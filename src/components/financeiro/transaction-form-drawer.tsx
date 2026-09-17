"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ZodError } from "zod";

import type { FinancialCategory, FinancialTransaction, FinancialTransactionStatus } from "@/lib/types";
import {
  createTransaction,
  updateTransaction,
  type ClientOption,
  type FinancialTransactionInput,
} from "@/lib/data/financial";
import { financialTransactionStatusConfig } from "@/lib/status";
import { toISODate, MOCK_TODAY } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryQuickCreateDialog } from "@/components/financeiro/category-quick-create-dialog";

const NO_CLIENT = "nenhum";
const NEW_CATEGORY = "__nova__";

interface FormState {
  description: string;
  amount: string;
  categoryId: string;
  clientId: string;
  dueDate: string;
  status: FinancialTransactionStatus;
  paidAt: string;
}

function emptyForm(defaultClientId?: string): FormState {
  return {
    description: "",
    amount: "",
    categoryId: "",
    clientId: defaultClientId ?? NO_CLIENT,
    dueDate: "",
    status: "previsto",
    paidAt: "",
  };
}

function toFormState(transaction: FinancialTransaction): FormState {
  return {
    description: transaction.description,
    amount: String(transaction.amount),
    categoryId: transaction.categoryId ?? "",
    clientId: transaction.clientId ?? NO_CLIENT,
    dueDate: transaction.dueDate ?? "",
    status: transaction.status,
    paidAt: transaction.paidAt ?? "",
  };
}

interface TransactionFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction | null;
  categories: FinancialCategory[];
  clients: ClientOption[];
  defaultClientId?: string;
  onSaved?: (transaction: FinancialTransaction) => void;
  onCategoryCreated?: (category: FinancialCategory) => void;
}

export function TransactionFormDrawer({
  open,
  onOpenChange,
  transaction,
  categories,
  clients,
  defaultClientId,
  onSaved,
  onCategoryCreated,
}: TransactionFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    transaction ? toFormState(transaction) : emptyForm(defaultClientId),
  );
  const [submitting, setSubmitting] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const isEditing = Boolean(transaction);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY) {
      setCategoryDialogOpen(true);
      return;
    }
    update("categoryId", value);
  }

  function handleStatusChange(value: FinancialTransactionStatus) {
    setForm((prev) => ({
      ...prev,
      status: value,
      paidAt: value === "pago" ? prev.paidAt || toISODate(MOCK_TODAY) : "",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.description.trim() || !form.categoryId || !form.amount) {
      toast.error("Preencha descrição, categoria e valor.");
      return;
    }

    const payload: FinancialTransactionInput = {
      description: form.description.trim(),
      amount: Number(form.amount),
      categoryId: form.categoryId,
      clientId: form.clientId === NO_CLIENT ? null : form.clientId,
      dueDate: form.dueDate || undefined,
      status: form.status,
      paidAt: form.status === "pago" ? form.paidAt || toISODate(MOCK_TODAY) : undefined,
    };

    setSubmitting(true);
    try {
      const saved =
        isEditing && transaction
          ? await updateTransaction(transaction.id, payload)
          : await createTransaction(payload);

      onSaved?.(saved);
      onOpenChange(false);
      toast.success(isEditing ? "Lançamento atualizado com sucesso." : "Lançamento criado com sucesso.");
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? "Verifique os dados informados.");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o lançamento. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>{isEditing ? "Editar lançamento" : "Novo lançamento"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "As alterações são salvas diretamente no banco de dados."
                : "O lançamento é salvo diretamente no banco de dados da sua organização."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-3">
              <FormField label="Descrição" required>
                <Input value={form.description} onChange={(e) => update("description", e.target.value)} />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Valor" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                  />
                </FormField>

                <FormField label="Categoria" required>
                  <Select value={form.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger aria-label="Categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} · {category.type === "receita" ? "Receita" : "Despesa"}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_CATEGORY}>
                        <Plus className="size-3.5" />
                        Nova categoria
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Cliente">
                  <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                    <SelectTrigger aria-label="Cliente">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT}>Interno (sem cliente)</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Vencimento">
                  <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
                </FormField>

                <FormField label="Status">
                  <Select value={form.status} onValueChange={(v) => handleStatusChange(v as FinancialTransactionStatus)}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(financialTransactionStatusConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {form.status === "pago" && (
                  <FormField label="Data do pagamento">
                    <Input type="date" value={form.paidAt} onChange={(e) => update("paidAt", e.target.value)} />
                  </FormField>
                )}
              </div>
            </div>

            <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar lançamento"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <CategoryQuickCreateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(category) => {
          onCategoryCreated?.(category);
          update("categoryId", category.id);
        }}
      />
    </>
  );
}
