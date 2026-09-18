"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Lead, LeadInput, Stage } from "@/lib/data/crm";
import { createLead, updateLead } from "@/lib/data/crm";
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

interface ProfileOption {
  id: string;
  name: string;
}

const NONE = "nenhum";

interface FormState {
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  responsibleId: string;
  source: string;
  serviceId: string;
  expectedValue: string;
  expectedCloseDate: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    company: "",
    phone: "",
    whatsapp: "",
    email: "",
    responsibleId: NONE,
    source: "",
    serviceId: NONE,
    expectedValue: "",
    expectedCloseDate: "",
    notes: "",
  };
}

function toFormState(lead: Lead): FormState {
  return {
    name: lead.name,
    company: lead.company ?? "",
    phone: lead.phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    responsibleId: lead.responsibleId ?? NONE,
    source: lead.source ?? "",
    serviceId: lead.serviceId ?? NONE,
    expectedValue: lead.expectedValue !== null ? String(lead.expectedValue) : "",
    expectedCloseDate: lead.expectedCloseDate ?? "",
    notes: lead.notes ?? "",
  };
}

interface LeadFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  pipelineId: string;
  defaultStageId: string;
  stages: Stage[];
  profiles: ProfileOption[];
  products: Product[];
  onSaved?: () => void;
}

export function LeadFormDrawer({
  open,
  onOpenChange,
  lead,
  pipelineId,
  defaultStageId,
  stages,
  profiles,
  products,
  onSaved,
}: LeadFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => (lead ? toFormState(lead) : emptyForm()));
  const [stageId, setStageId] = useState(lead?.stageId ?? defaultStageId);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(lead);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do lead/negócio.");
      return;
    }

    const payload: LeadInput = {
      pipelineId,
      stageId,
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      phone: form.phone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      email: form.email.trim() || undefined,
      responsibleId: form.responsibleId === NONE ? undefined : form.responsibleId,
      source: form.source.trim() || undefined,
      serviceId: form.serviceId === NONE ? undefined : form.serviceId,
      expectedValue: form.expectedValue ? Number(form.expectedValue) : undefined,
      expectedCloseDate: form.expectedCloseDate || undefined,
      notes: form.notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (isEditing && lead) await updateLead(lead.id, payload);
      else await createLead(payload);
      toast.success(isEditing ? "Negócio atualizado." : "Negócio criado.");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o negócio."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar negócio" : "Novo negócio"}</SheetTitle>
          <SheetDescription>Lead/oportunidade comercial.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Nome" required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Empresa">
                <Input value={form.company} onChange={(e) => update("company", e.target.value)} />
              </FormField>
              <FormField label="E-mail">
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </FormField>
              <FormField label="Telefone">
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </FormField>
              <FormField label="WhatsApp">
                <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
              </FormField>
              <FormField label="Origem">
                <Input placeholder="Indicação, site, Meta Ads..." value={form.source} onChange={(e) => update("source", e.target.value)} />
              </FormField>
              <FormField label="Responsável">
                <Select value={form.responsibleId} onValueChange={(v) => update("responsibleId", v)}>
                  <SelectTrigger aria-label="Responsável">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem responsável</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Produto/serviço de interesse">
                <Select value={form.serviceId} onValueChange={(v) => update("serviceId", v)}>
                  <SelectTrigger aria-label="Produto/serviço de interesse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Valor esperado">
                <Input type="number" min="0" step="0.01" value={form.expectedValue} onChange={(e) => update("expectedValue", e.target.value)} />
              </FormField>
              <FormField label="Etapa">
                <Select value={stageId} onValueChange={setStageId}>
                  <SelectTrigger aria-label="Etapa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Previsão de fechamento">
                <Input type="date" value={form.expectedCloseDate} onChange={(e) => update("expectedCloseDate", e.target.value)} />
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
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar negócio"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
