"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

import type { CalendarEvent, CalendarEventType } from "@/lib/types";
import type { ClientOption, ProjectOption } from "@/lib/data/tasks";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/data/calendar";
import { calendarEventTypeConfig } from "@/lib/status";
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

const NO_CLIENT = "nenhum";
const NO_PROJECT = "nenhum";

interface FormState {
  title: string;
  type: CalendarEventType;
  clientId: string;
  projectId: string;
  date: string;
  time: string;
  description: string;
}

function emptyForm(defaultDate?: string): FormState {
  return {
    title: "",
    type: "reuniao",
    clientId: NO_CLIENT,
    projectId: NO_PROJECT,
    date: defaultDate ?? "",
    time: "",
    description: "",
  };
}

function toFormState(event: CalendarEvent): FormState {
  return {
    title: event.title,
    type: event.type,
    clientId: event.clientId ?? NO_CLIENT,
    projectId: event.projectId ?? NO_PROJECT,
    date: event.date,
    time: event.time ?? "",
    description: event.description ?? "",
  };
}

interface EventFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  clients: ClientOption[];
  projects: ProjectOption[];
  defaultDate?: string;
  onSaved?: () => void;
}

export function EventFormDrawer({
  open,
  onOpenChange,
  event,
  clients,
  projects,
  defaultDate,
  onSaved,
}: EventFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    event ? toFormState(event) : emptyForm(defaultDate),
  );
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(event);
  const eventId = event?.id;

  const availableProjects = useMemo(
    () =>
      form.clientId === NO_CLIENT
        ? []
        : projects.filter((project) => project.clientId === form.clientId),
    [form.clientId, projects],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClientChange(clientId: string) {
    setForm((prev) => ({
      ...prev,
      clientId,
      projectId: projects.some((p) => p.id === prev.projectId && p.clientId === clientId)
        ? prev.projectId
        : NO_PROJECT,
    }));
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();

    if (!form.title.trim() || !form.date) {
      toast.error("Preencha ao menos o título e a data do evento.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      clientId: form.clientId === NO_CLIENT ? null : form.clientId,
      projectId: form.projectId === NO_PROJECT ? null : form.projectId,
      date: form.date,
      time: form.time || undefined,
      description: form.description.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (isEditing && eventId) {
        await updateCalendarEvent(eventId, payload);
      } else {
        await createCalendarEvent(payload);
      }

      onSaved?.();
      onOpenChange(false);
      toast.success(isEditing ? "Evento atualizado com sucesso." : "Evento criado com sucesso.");
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? "Verifique os dados informados.");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o evento. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar evento" : "Novo evento"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "As alterações são salvas diretamente no banco de dados."
              : "O evento é salvo diretamente no banco de dados da sua organização."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Título" required>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </FormField>

            <FormField label="Tipo">
              <Select value={form.type} onValueChange={(v) => update("type", v as CalendarEventType)}>
                <SelectTrigger aria-label="Tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(calendarEventTypeConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cliente">
                <Select value={form.clientId} onValueChange={handleClientChange}>
                  <SelectTrigger aria-label="Cliente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CLIENT}>Sem cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Projeto">
                <Select
                  value={form.projectId}
                  onValueChange={(v) => update("projectId", v)}
                  disabled={form.clientId === NO_CLIENT}
                >
                  <SelectTrigger aria-label="Projeto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PROJECT}>Sem projeto</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data" required>
                <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
              </FormField>
              <FormField label="Horário">
                <Input type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
              </FormField>
            </div>

            <FormField label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </FormField>
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar evento"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
