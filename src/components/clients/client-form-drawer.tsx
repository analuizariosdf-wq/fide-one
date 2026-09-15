"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Client, ClientStatus } from "@/lib/types";
import { SERVICE_OPTIONS } from "@/lib/mock-data/clients";
import { team } from "@/lib/mock-data/users";
import { clientStatusConfig } from "@/lib/status";
import { createClient, updateClient } from "@/lib/services/clients-service";
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
import { TagSelect } from "@/components/ui/tag-select";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_METHODS = ["Boleto", "Pix", "Cartão de crédito", "Transferência"];

interface FormState {
  name: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  website: string;
  instagram: string;
  email: string;
  phone: string;
  responsibleId: string;
  services: string[];
  startDate: string;
  status: ClientStatus;
  monthlyFee: string;
  dueDay: string;
  paymentMethod: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  tradeName: "",
  cnpj: "",
  segment: "",
  website: "",
  instagram: "",
  email: "",
  phone: "",
  responsibleId: team[0]?.id ?? "",
  services: [],
  startDate: "",
  status: "lead",
  monthlyFee: "",
  dueDay: "",
  paymentMethod: PAYMENT_METHODS[0],
  notes: "",
};

function toFormState(client: Client): FormState {
  return {
    name: client.name,
    tradeName: client.tradeName ?? "",
    cnpj: client.cnpj ?? "",
    segment: client.segment,
    website: client.website ?? "",
    instagram: client.instagram ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    responsibleId: client.responsibleId,
    services: client.services,
    startDate: client.startDate,
    status: client.status,
    monthlyFee: String(client.monthlyFee),
    dueDay: String(client.dueDay),
    paymentMethod: client.paymentMethod,
    notes: client.notes ?? "",
  };
}

interface ClientFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved?: (client: Client) => void;
}

export function ClientFormDrawer({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    client ? toFormState(client) : emptyForm,
  );
  const isEditing = Boolean(client);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.segment.trim()) {
      toast.error("Preencha ao menos nome e segmento do cliente.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      tradeName: form.tradeName.trim() || undefined,
      cnpj: form.cnpj.trim() || undefined,
      segment: form.segment.trim(),
      website: form.website.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      responsibleId: form.responsibleId,
      services: form.services,
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      status: form.status,
      monthlyFee: Number(form.monthlyFee) || 0,
      dueDay: Number(form.dueDay) || 1,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim() || undefined,
    };

    const saved =
      isEditing && client
        ? updateClient(client.id, payload)
        : createClient(payload);

    if (saved) onSaved?.(saved);
    onOpenChange(false);
    toast.success(isEditing ? "Cliente atualizado com sucesso." : "Cliente criado com sucesso.");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</SheetTitle>
          <SheetDescription>
            Os dados são mockados nesta etapa — nada é persistido em banco.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
        >
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Informações
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Nome" required>
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
                </FormField>
                <FormField label="Nome fantasia">
                  <Input value={form.tradeName} onChange={(e) => update("tradeName", e.target.value)} />
                </FormField>
                <FormField label="CNPJ">
                  <Input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
                </FormField>
                <FormField label="Segmento" required>
                  <Input value={form.segment} onChange={(e) => update("segment", e.target.value)} />
                </FormField>
                <FormField label="Site">
                  <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
                </FormField>
                <FormField label="Instagram">
                  <Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} />
                </FormField>
                <FormField label="E-mail">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </FormField>
                <FormField label="Telefone">
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </FormField>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Gestão
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Responsável">
                  <Select value={form.responsibleId} onValueChange={(v) => update("responsibleId", v)}>
                    <SelectTrigger aria-label="Responsável">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {team.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select value={form.status} onValueChange={(v) => update("status", v as ClientStatus)}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(clientStatusConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Data de início">
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update("startDate", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Serviços contratados">
                <TagSelect
                  options={SERVICE_OPTIONS}
                  value={form.services}
                  onChange={(v) => update("services", v)}
                />
              </FormField>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Financeiro
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label="Mensalidade (R$)">
                  <Input
                    type="number"
                    min={0}
                    value={form.monthlyFee}
                    onChange={(e) => update("monthlyFee", e.target.value)}
                  />
                </FormField>
                <FormField label="Dia de vencimento">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={form.dueDay}
                    onChange={(e) => update("dueDay", e.target.value)}
                  />
                </FormField>
                <FormField label="Forma de pagamento">
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(v) => update("paymentMethod", v)}
                  >
                    <SelectTrigger aria-label="Forma de pagamento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Observações
              </h3>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Observações internas sobre o cliente..."
              />
            </section>
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Salvar alterações" : "Criar cliente"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
