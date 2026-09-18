"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Contract, ContractBillingPeriod, ContractInput, ContractStatus } from "@/lib/data/contracts";
import { createContract, updateContract } from "@/lib/data/contracts";
import type { Product } from "@/lib/data/products";
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

const BILLING_PERIODS: ContractBillingPeriod[] = ["unico", "mensal", "trimestral", "semestral", "anual"];
const STATUSES: ContractStatus[] = ["ativo", "suspenso", "encerrado"];

interface ClientOption {
  id: string;
  name: string;
}

interface FormState {
  clientId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  monthlyValue: string;
  billingPeriod: ContractBillingPeriod;
  status: ContractStatus;
  autoRenew: boolean;
  notes: string;
}

function emptyForm(defaultClientId?: string): FormState {
  return {
    clientId: defaultClientId ?? "",
    serviceId: "",
    startDate: "",
    endDate: "",
    monthlyValue: "",
    billingPeriod: "mensal",
    status: "ativo",
    autoRenew: false,
    notes: "",
  };
}

function toFormState(contract: Contract): FormState {
  return {
    clientId: contract.clientId,
    serviceId: contract.serviceId ?? "",
    startDate: contract.startDate,
    endDate: contract.endDate ?? "",
    monthlyValue: contract.monthlyValue !== null ? String(contract.monthlyValue) : "",
    billingPeriod: contract.billingPeriod,
    status: contract.status,
    autoRenew: contract.autoRenew,
    notes: contract.notes ?? "",
  };
}

const NO_SERVICE = "nenhum";

interface ContractFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
  clients: ClientOption[];
  products: Product[];
  defaultClientId?: string;
  onSaved?: () => void;
}

export function ContractFormDrawer({
  open,
  onOpenChange,
  contract,
  clients,
  products,
  defaultClientId,
  onSaved,
}: ContractFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => (contract ? toFormState(contract) : emptyForm(defaultClientId)));
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(contract);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.clientId || !form.startDate) {
      toast.error("Selecione o cliente e informe o início do contrato.");
      return;
    }

    const payload: ContractInput = {
      clientId: form.clientId,
      serviceId: form.serviceId === NO_SERVICE || !form.serviceId ? null : form.serviceId,
      startDate: form.startDate,
      endDate: form.endDate || null,
      monthlyValue: form.monthlyValue ? Number(form.monthlyValue) : null,
      billingPeriod: form.billingPeriod,
      status: form.status,
      autoRenew: form.autoRenew,
      notes: form.notes || null,
    };

    setSubmitting(true);
    try {
      if (isEditing && contract) await updateContract(contract.id, payload);
      else await createContract(payload);
      toast.success(isEditing ? "Contrato atualizado." : "Contrato criado.");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o contrato."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar contrato" : "Novo contrato"}</SheetTitle>
          <SheetDescription>Tempo de contrato e valor recorrente do cliente.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Cliente" required>
              <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                <SelectTrigger aria-label="Cliente">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Produto/serviço">
              <Select value={form.serviceId || NO_SERVICE} onValueChange={(v) => update("serviceId", v)}>
                <SelectTrigger aria-label="Produto/serviço">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SERVICE}>Nenhum</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Início" required>
                <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </FormField>
              <FormField label="Fim">
                <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </FormField>
              <FormField label="Valor">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyValue}
                  onChange={(e) => update("monthlyValue", e.target.value)}
                />
              </FormField>
              <FormField label="Periodicidade">
                <Select value={form.billingPeriod} onValueChange={(v) => update("billingPeriod", v as ContractBillingPeriod)}>
                  <SelectTrigger aria-label="Periodicidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_PERIODS.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v as ContractStatus)}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Renovação automática">
                <Select value={form.autoRenew ? "sim" : "nao"} onValueChange={(v) => update("autoRenew", v === "sim")}>
                  <SelectTrigger aria-label="Renovação automática">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Observações">
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </FormField>
          </div>
          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar contrato"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
