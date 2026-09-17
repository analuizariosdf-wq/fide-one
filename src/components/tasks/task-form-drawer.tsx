"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

import type { Task, TaskUrgency, TaskWorkflowStatus } from "@/lib/types";
import {
  createTask,
  updateTask,
  type ClientOption,
  type ProfileOption,
  type ProjectOption,
} from "@/lib/data/tasks";
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
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? "Verifique os dados informados.");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar a tarefa. Tente novamente.");
      }
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
