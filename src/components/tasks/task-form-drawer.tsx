"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/error-message";
import type { Task, TaskUrgency, TaskWorkflowStatus } from "@/lib/types";
import {
  createTask,
  updateTask,
  type ClientOption,
  type ProfileOption,
  type ProjectOption,
} from "@/lib/data/tasks";
import {
  loadTaskReminders,
  createTaskReminder,
  removeTaskReminder,
  type TaskReminder,
} from "@/lib/data/task-reminders";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
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
const NO_ASSIGNEE = "nenhum";

interface FormState {
  title: string;
  description: string;
  clientId: string;
  projectId: string;
  assigneeId: string;
  priority: TaskUrgency;
  status: TaskWorkflowStatus;
  dueDate: string;
}

function emptyForm(defaults?: { clientId?: string; projectId?: string }): FormState {
  return {
    title: "",
    description: "",
    clientId: defaults?.clientId ?? NO_CLIENT,
    projectId: defaults?.projectId ?? NO_PROJECT,
    assigneeId: NO_ASSIGNEE,
    priority: "normal",
    status: "backlog",
    dueDate: "",
  };
}

function toFormState(task: Task): FormState {
  return {
    title: task.title,
    description: task.description ?? "",
    clientId: task.clientId ?? NO_CLIENT,
    projectId: task.projectId ?? NO_PROJECT,
    assigneeId: task.assigneeId || NO_ASSIGNEE,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
  };
}

interface TaskFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
  defaultClientId?: string;
  defaultProjectId?: string;
  onSaved?: (task: Task) => void;
}

export function TaskFormDrawer({
  open,
  onOpenChange,
  task,
  clients,
  projects,
  profiles,
  defaultClientId,
  defaultProjectId,
  onSaved,
}: TaskFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    task ? toFormState(task) : emptyForm({ clientId: defaultClientId, projectId: defaultProjectId }),
  );
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(task);

  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [reminderOffset, setReminderOffset] = useState(0);
  const [reminderTime, setReminderTime] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);

  useEffect(() => {
    if (!task) return;
    let active = true;
    loadTaskReminders(task.id)
      .then((data) => {
        if (active) setReminders(data);
      })
      .catch(() => {
        // Non-critical — the task still works without reminders loaded.
      });
    return () => {
      active = false;
    };
  }, [task]);

  async function handleAddReminder() {
    if (!task) return;
    setAddingReminder(true);
    try {
      const created = await createTaskReminder(task.id, {
        offsetDays: reminderOffset,
        remindTime: reminderTime || null,
        channel: "email",
      });
      setReminders((prev) => [created, ...prev]);
      setReminderOffset(0);
      setReminderTime("");
    } catch {
      toast.error("Não foi possível criar o lembrete.");
    } finally {
      setAddingReminder(false);
    }
  }

  async function handleRemoveReminder(reminder: TaskReminder) {
    try {
      await removeTaskReminder(reminder.id);
      setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
    } catch {
      toast.error("Não foi possível remover o lembrete.");
    }
  }

  function reminderLabel(offsetDays: number): string {
    if (offsetDays === 0) return "No dia do prazo";
    if (offsetDays === 1) return "1 dia antes";
    return `${offsetDays} dias antes`;
  }

  const availableProjects = useMemo(
    () =>
      form.clientId === NO_CLIENT
        ? projects
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
      projectId:
        prev.projectId === NO_PROJECT
          ? NO_PROJECT
          : clientId === NO_CLIENT ||
              projects.some((p) => p.id === prev.projectId && p.clientId === clientId)
            ? prev.projectId
            : NO_PROJECT,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.dueDate) {
      toast.error("Preencha ao menos o título e o prazo da tarefa.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      clientId: form.clientId === NO_CLIENT ? null : form.clientId,
      projectId: form.projectId === NO_PROJECT ? null : form.projectId,
      assigneeId: form.assigneeId === NO_ASSIGNEE ? null : form.assigneeId,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate,
    };

    setSubmitting(true);
    try {
      const saved = isEditing && task ? await updateTask(task.id, payload) : await createTask(payload);

      onSaved?.(saved);
      onOpenChange(false);
      toast.success(isEditing ? "Tarefa atualizada com sucesso." : "Tarefa criada com sucesso.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a tarefa. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "As alterações são salvas diretamente no banco de dados."
              : "A tarefa é salva diretamente no banco de dados da sua organização."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Informações
              </h3>

              <FormField label="Título" required>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
              </FormField>

              <FormField label="Descrição">
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Cliente">
                  <Select value={form.clientId} onValueChange={handleClientChange}>
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

                <FormField label="Projeto">
                  <Select value={form.projectId} onValueChange={(v) => update("projectId", v)}>
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

                <FormField label="Responsável">
                  <Select value={form.assigneeId} onValueChange={(v) => update("assigneeId", v)}>
                    <SelectTrigger aria-label="Responsável">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ASSIGNEE}>Sem responsável</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Prioridade">
                  <Select
                    value={form.priority}
                    onValueChange={(v) => update("priority", v as TaskUrgency)}
                  >
                    <SelectTrigger aria-label="Prioridade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(taskUrgencyConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => update("status", v as TaskWorkflowStatus)}
                  >
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(taskWorkflowConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Prazo" required>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => update("dueDate", e.target.value)}
                  />
                </FormField>
              </div>
            </section>

            {isEditing && task && (
              <section className="flex flex-col gap-3 border-t border-border pt-5">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Lembretes
                </h3>

                {reminders.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-[13px]"
                      >
                        <span>
                          {reminderLabel(reminder.offsetDays)}
                          {reminder.remindTime && ` às ${reminder.remindTime.slice(0, 5)}`}
                          {" · e-mail"}
                        </span>
                        <button
                          type="button"
                          aria-label="Remover lembrete"
                          onClick={() => handleRemoveReminder(reminder)}
                          className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <FormField label="Dias antes do prazo">
                    <Input
                      type="number"
                      min={0}
                      value={reminderOffset}
                      onChange={(e) => setReminderOffset(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </FormField>
                  <FormField label="Horário (opcional)">
                    <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                  </FormField>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" onClick={handleAddReminder} disabled={addingReminder}>
                      Adicionar
                    </Button>
                  </div>
                </div>

                <p className="text-[12px] text-muted-foreground">
                  Lembretes são enviados por e-mail ao responsável, uma vez por dia (09:00,
                  horário de Brasília) — o horário acima é aproximado, não um envio exato àquele
                  minuto.{" "}
                  <span className="italic">WhatsApp — integração futura.</span>
                </p>
              </section>
            )}
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar tarefa"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
