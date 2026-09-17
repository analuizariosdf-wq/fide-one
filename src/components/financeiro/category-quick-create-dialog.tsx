"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

import type { FinancialCategory, FinancialCategoryType } from "@/lib/types";
import { createFinancialCategory } from "@/lib/data/financial";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface CategoryQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: FinancialCategory) => void;
}

/**
 * Inline "criar categoria" for the transaction form's category picker —
 * not a full categories management screen (out of scope for the MVP).
 */
export function CategoryQuickCreateDialog({ open, onOpenChange, onCreated }: CategoryQuickCreateDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FinancialCategoryType>("receita");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const category = await createFinancialCategory({ name, type });
      toast.success("Categoria criada.");
      onCreated(category);
      setName("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? "Verifique os dados informados.");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível criar a categoria. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>A categoria fica disponível para toda a organização.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nome" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Tipo" required>
            <Select value={type} onValueChange={(v) => setType(v as FinancialCategoryType)}>
              <SelectTrigger aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
