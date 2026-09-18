"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/error-message";
import type { Content, ContentChannel, ContentEditorialStatus, ContentType, Task } from "@/lib/types";
import { CHANNEL_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/lib/mock-data/contents";
import {
  createContent,
  updateContent,
  type ClientOption,
  type ProfileOption,
  type ProjectOption,
} from "@/lib/data/contents";
import { useLabels, loadContentLabelIds, syncContentLabels } from "@/lib/data/labels";
import { contentEditorialConfig } from "@/lib/status";
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

const NO_PROJECT = "nenhum";
const NO_ASSIGNEE = "nenhum";

interface FormState {
  title: string;
  clientId: string;
  projectId: string;
  contentType: ContentType;
  channel: ContentChannel;
  status: ContentEditorialStatus;
  responsibleId: string;
  publishDate: string;
  publishTime: string;
  description: string;
  caption: string;
  cta: string;
  taskIds: string[];
}

function emptyForm(
  clients: ClientOption[],
  defaultClientId?: string,
  defaultProjectId?: string,
  defaultPublishDate?: string,
): FormState {
  return {
    title: "",
    clientId: defaultClientId ?? clients[0]?.id ?? "",
    projectId: defaultProjectId ?? NO_PROJECT,
    contentType: CONTENT_TYPE_OPTIONS[0],
    channel: CHANNEL_OPTIONS[0],
    status: "ideia",
    responsibleId: NO_ASSIGNEE,
    publishDate: defaultPublishDate ?? "",
    publishTime: "",
    description: "",
    caption: "",
    cta: "",
    taskIds: [],
  };
}

function toFormState(content: Content): FormState {
  return {
    title: content.title,
    clientId: content.clientId,
    projectId: content.projectId ?? NO_PROJECT,
    contentType: content.contentType,
    channel: content.channel,
    status: content.status,
    responsibleId: content.responsibleId || NO_ASSIGNEE,
    publishDate: content.publishDate,
    publishTime: content.publishTime ?? "",
    description: content.description ?? "",
    caption: content.caption ?? "",
    cta: content.cta ?? "",
    taskIds: content.taskIds,
  };
}

interface ContentFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: Content | null;
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
  tasks: Task[];
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultPublishDate?: string;
  onSaved?: (content: Content) => void;
}

export function ContentFormDrawer({
  open,
  onOpenChange,
  content,
  clients,
  projects,
  profiles,
  tasks,
  defaultClientId,
  defaultProjectId,
  defaultPublishDate,
  onSaved,
}: ContentFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    content ? toFormState(content) : emptyForm(clients, defaultClientId, defaultProjectId, defaultPublishDate),
  );
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(content);

  const { labels } = useLabels();
  const [labelIds, setLabelIds] = useState<string[]>([]);

  useEffect(() => {
    if (!content) return;
    let active = true;
    loadContentLabelIds(content.id)
      .then((ids) => {
        if (active) setLabelIds(ids);
      })
      .catch(() => {
        // Non-critical — the form still works without labels pre-selected.
      });
    return () => {
      active = false;
    };
  }, [content]);

  function toggleLabel(labelId: string) {
    setLabelIds((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]));
  }

  const availableProjects = useMemo(
    () => projects.filter((project) => project.clientId === form.clientId),
    [form.clientId, projects],
  );
  const availableTasks = useMemo(
    () => tasks.filter((task) => task.clientId === form.clientId),
    [form.clientId, tasks],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClientChange(clientId: string) {
    const nextTasks = tasks.filter((task) => task.clientId === clientId);
    setForm((prev) => ({
      ...prev,
      clientId,
      projectId: projects.some((p) => p.id === prev.projectId && p.clientId === clientId)
        ? prev.projectId
        : NO_PROJECT,
      taskIds: prev.taskIds.filter((id) => nextTasks.some((t) => t.id === id)),
    }));
  }

  function toggleTask(taskId: string) {
    setForm((prev) => ({
      ...prev,
      taskIds: prev.taskIds.includes(taskId)
        ? prev.taskIds.filter((id) => id !== taskId)
        : [...prev.taskIds, taskId],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.clientId || !form.publishDate) {
      toast.error("Preencha ao menos título, cliente e data de publicação.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      clientId: form.clientId,
      projectId: form.projectId === NO_PROJECT ? null : form.projectId,
      contentType: form.contentType,
      channel: form.channel,
      status: form.status,
      responsibleId: form.responsibleId === NO_ASSIGNEE ? null : form.responsibleId,
      publishDate: form.publishDate,
      publishTime: form.publishTime || undefined,
      description: form.description.trim() || undefined,
      caption: form.caption.trim() || undefined,
      cta: form.cta.trim() || undefined,
      taskIds: form.taskIds,
    };

    setSubmitting(true);
    try {
      const saved =
        isEditing && content ? await updateContent(content.id, payload) : await createContent(payload);
      await syncContentLabels(saved.id, labelIds);

      onSaved?.(saved);
      onOpenChange(false);
      toast.success(isEditing ? "Conteúdo atualizado com sucesso." : "Conteúdo criado com sucesso.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o conteúdo. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar conteúdo" : "Novo conteúdo"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "As alterações são salvas diretamente no banco de dados."
              : "O conteúdo é salvo diretamente no banco de dados da sua organização."}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Cliente" required>
                  <Select value={form.clientId} onValueChange={handleClientChange}>
                    <SelectTrigger aria-label="Cliente">
                      <SelectValue />
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

                <FormField label="Tipo de conteúdo">
                  <Select
                    value={form.contentType}
                    onValueChange={(v) => update("contentType", v as ContentType)}
                  >
                    <SelectTrigger aria-label="Tipo de conteúdo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Canal">
                  <Select
                    value={form.channel}
                    onValueChange={(v) => update("channel", v as ContentChannel)}
                  >
                    <SelectTrigger aria-label="Canal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {channel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => update("status", v as ContentEditorialStatus)}
                  >
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contentEditorialConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Responsável">
                  <Select value={form.responsibleId} onValueChange={(v) => update("responsibleId", v)}>
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

                <FormField label="Data de publicação" required>
                  <Input
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => update("publishDate", e.target.value)}
                  />
                </FormField>

                <FormField label="Horário">
                  <Input
                    type="time"
                    value={form.publishTime}
                    onChange={(e) => update("publishTime", e.target.value)}
                  />
                </FormField>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Conteúdo
              </h3>
              <FormField label="Descrição">
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </FormField>
              <FormField label="Legenda">
                <Textarea value={form.caption} onChange={(e) => update("caption", e.target.value)} />
              </FormField>
              <FormField label="CTA">
                <Input value={form.cta} onChange={(e) => update("cta", e.target.value)} />
              </FormField>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Relacionamentos
              </h3>
              <FormField label="Tarefas relacionadas">
                {availableTasks.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    Nenhuma tarefa cadastrada para este cliente ainda.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTasks.map((task) => {
                      const selected = form.taskIds.includes(task.id);
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          aria-pressed={selected}
                          className={
                            selected
                              ? "rounded-full border border-primary bg-accent px-3 py-1 text-[12px] font-medium text-accent-foreground"
                              : "rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        >
                          {task.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </FormField>

              <FormField label="Etiquetas">
                {labels.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    Nenhuma etiqueta cadastrada — gerencie em Calendário → Gerenciar etiquetas.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => {
                      const selected = labelIds.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          aria-pressed={selected}
                          style={selected ? { borderColor: label.color, backgroundColor: `${label.color}1a`, color: label.color } : undefined}
                          className={
                            selected
                              ? "rounded-full border px-3 py-1 text-[12px] font-medium"
                              : "rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        >
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </FormField>
            </section>
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar conteúdo"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
