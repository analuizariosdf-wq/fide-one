"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Product, ProductBillingType, ProductInput } from "@/lib/data/products";
import { createProduct, updateProduct } from "@/lib/data/products";
import { getErrorMessage } from "@/lib/error-message";
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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BILLING_PERIOD_OPTIONS = ["mensal", "trimestral", "semestral", "anual"];

interface FormState {
  name: string;
  description: string;
  defaultPrice: string;
  billingType: ProductBillingType;
  billingPeriod: string;
  category: string;
  active: boolean;
}

function emptyForm(): FormState {
  return { name: "", description: "", defaultPrice: "", billingType: "recorrente", billingPeriod: "mensal", category: "", active: true };
}

function toFormState(product: Product): FormState {
  return {
    name: product.name,
    description: product.description ?? "",
    defaultPrice: product.defaultPrice !== null ? String(product.defaultPrice) : "",
    billingType: product.billingType ?? "recorrente",
    billingPeriod: product.billingPeriod ?? "mensal",
    category: product.category ?? "",
    active: product.active,
  };
}

interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSaved?: () => void;
}

export function ProductFormDrawer({ open, onOpenChange, product, onSaved }: ProductFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => (product ? toFormState(product) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(product);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto/serviço.");
      return;
    }

    const payload: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      defaultPrice: form.defaultPrice ? Number(form.defaultPrice) : undefined,
      billingType: form.billingType,
      billingPeriod: form.billingType === "recorrente" ? form.billingPeriod : undefined,
      category: form.category.trim() || undefined,
      active: form.active,
    };

    setSubmitting(true);
    try {
      if (isEditing && product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      toast.success(isEditing ? "Produto atualizado." : "Produto criado.");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o produto. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar produto" : "Novo produto"}</SheetTitle>
          <SheetDescription>Produtos e serviços vendidos pela agência.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Nome" required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </FormField>
            <FormField label="Descrição">
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Preço padrão">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultPrice}
                  onChange={(e) => update("defaultPrice", e.target.value)}
                />
              </FormField>
              <FormField label="Categoria">
                <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
              </FormField>
              <FormField label="Tipo">
                <Select value={form.billingType} onValueChange={(v) => update("billingType", v as ProductBillingType)}>
                  <SelectTrigger aria-label="Tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                    <SelectItem value="pontual">Pontual</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              {form.billingType === "recorrente" && (
                <FormField label="Periodicidade">
                  <Select value={form.billingPeriod} onValueChange={(v) => update("billingPeriod", v)}>
                    <SelectTrigger aria-label="Periodicidade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_PERIOD_OPTIONS.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
              <FormField label="Status">
                <Select value={form.active ? "ativo" : "inativo"} onValueChange={(v) => update("active", v === "ativo")}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar produto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
