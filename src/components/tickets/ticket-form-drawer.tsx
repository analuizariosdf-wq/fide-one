"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type {
  ClientOption,
  ProfileOption,
  ProjectOption,
  Ticket,
  TicketInput,
  TicketPriority,
  TicketStatus,
} from "@/lib/data/tickets";
import { createTicket, updateTicket } from "@/lib/data/tickets";
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

const NONE = "nenhum";
const PRIORITIES: TicketPriority[] = ["baixa", "normal", "alta", "urgente"];
const STATUSES: TicketStatus[] = ["aberto", "em_andamento", "aguardando", "resolvido", "fechado"];

interface FormState {
  title: string;
  description: string;
  assigneeId: string;
  clientId: string;
  projectId: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  dueDate: string;
}

function emptyForm(): FormState {
  return { title: "", description: "", assigneeId: NONE, clientId: NONE, projectId: NONE, category: "", priority: "normal", status: "aberto", dueDate: "" };
}

function toFormState(ticket: Ticket): FormState {
  return {
    title: ticket.title,
    description: ticket.description ?? "",
    assigneeId: ticket.assigneeId ?? NONE,
    clientId: ticket.clientId ?? NONE,
    projectId: ticket.projectId ?? NONE,
    category: ticket.category ?? "",
    priority: ticket.priority,
    status: ticket.status,
    dueDate: ticket.dueDate ?? "",
  };
}

interface TicketFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
  onSaved?: (ticket: Ticket) => void;
}

export function TicketFormDrawer({ open, onOpenChange, ticket, clients, projects, profiles, onSaved }: TicketFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => (ticket ? toFormState(ticket) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(ticket);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Informe o título do ticket.");
      return;
    }

    const payload: TicketInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId === NONE ? undefined : form.assigneeId,
      clientId: form.clientId === NONE ? undefined : form.clientId,
      projectId: form.projectId === NONE ? undefined : form.projectId,
      category: form.category.trim() || undefined,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || undefined,
    };

    setSubmitting(true);
    try {
      const saved = isEditing && ticket ? await updateTicket(ticket.id, payload) : await createTicket(payload);
      toast.success(isEditing ? "Ticket atualizado." : "Ticket criado.");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o ticket."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar ticket" : "Novo ticket"}</SheetTitle>
          <SheetDescription>Chamado interno da equipe.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Título" required>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </FormField>
            <FormField label="Descrição">
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Responsável">
                <Select value={form.assigneeId} onValueChange={(v) => update("assigneeId", v)}>
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
              <FormField label="Categoria">
                <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
              </FormField>
              <FormField label="Cliente (opcional)">
                <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                  <SelectTrigger aria-label="Cliente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Projeto (opcional)">
                <Select value={form.projectId} onValueChange={(v) => update("projectId", v)}>
                  <SelectTrigger aria-label="Projeto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Prioridade">
                <Select value={form.priority} onValueChange={(v) => update("priority", v as TicketPriority)}>
                  <SelectTrigger aria-label="Prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v as TicketStatus)}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Prazo">
                <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
              </FormField>
            </div>
          </div>
          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar ticket"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
