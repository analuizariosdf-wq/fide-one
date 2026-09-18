"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useServiceExtras,
  createServiceExtra,
  removeServiceExtra,
  type ServiceExtra,
  type ServiceExtraStatus,
} from "@/lib/data/service-extras";
import type { Product } from "@/lib/data/products";
import type { Task, Content } from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NO_SERVICE = "nenhum";
const NO_TASK = "nenhum";
const NO_CONTENT = "nenhum";

const statusLabels: Record<ServiceExtraStatus, string> = {
  registrado: "Registrado",
  cobrado: "Cobrado",
  cortesia: "Cortesia",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  description: string;
  occurredOn: string;
  serviceId: string;
  taskId: string;
  contentId: string;
  status: ServiceExtraStatus;
}

function emptyForm(): FormState {
  return {
    description: "",
    occurredOn: todayISO(),
    serviceId: NO_SERVICE,
    taskId: NO_TASK,
    contentId: NO_CONTENT,
    status: "registrado",
  };
}

interface ServiceExtrasPanelProps {
  clientId: string;
  services: Product[];
  tasks: Task[];
  contents: Content[];
}

/**
 * "Serviço Extra / Fora do Escopo" — CRUD against `service_extras`,
 * optionally linked to a task/content of this same client. Every row
 * carries the "EXTRA" flag visually, since that's the whole point of
 * the section.
 */
export function ServiceExtrasPanel({ clientId, services, tasks, contents }: ServiceExtrasPanelProps) {
  const { extras, loading, error, refetch } = useServiceExtras(clientId);
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const contentById = new Map(contents.map((c) => [c.id, c]));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<ServiceExtra | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setForm(emptyForm());
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.description.trim()) {
      toast.error("Descreva o serviço extra.");
      return;
    }
    setSubmitting(true);
    try {
      await createServiceExtra(clientId, {
        description: form.description.trim(),
        occurredOn: form.occurredOn || todayISO(),
        serviceId: form.serviceId === NO_SERVICE ? null : form.serviceId,
        taskId: form.taskId === NO_TASK ? null : form.taskId,
        contentId: form.contentId === NO_CONTENT ? null : form.contentId,
        status: form.status,
      });
      toast.success("Serviço extra registrado.");
      setDialogOpen(false);
      refetch();
    } catch {
      toast.error("Não foi possível registrar o serviço extra.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await removeServiceExtra(deleting.id);
      toast.success("Registro excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o registro.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviço extra / Fora do escopo</CardTitle>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" />
          Novo registro
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : extras.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhum serviço extra registrado"
            description="Registre trabalhos fora do escopo contratado para manter o histórico."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">EXTRA</Badge>
                    <p className="text-[13px] font-medium text-foreground">{extra.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                    <span>{formatDateShort(extra.occurredOn)}</span>
                    <span>{statusLabels[extra.status]}</span>
                    {extra.serviceId && <span>{serviceById.get(extra.serviceId)?.name}</span>}
                    {extra.taskId && <span>Tarefa: {taskById.get(extra.taskId)?.title ?? "—"}</span>}
                    {extra.contentId && <span>Conteúdo: {contentById.get(extra.contentId)?.title ?? "—"}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDeleting(extra)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo serviço extra</DialogTitle>
            <DialogDescription>Trabalho fora do escopo contratado, opcionalmente ligado a uma tarefa ou conteúdo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <FormField label="Descrição" required>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data">
                <Input type="date" value={form.occurredOn} onChange={(e) => update("occurredOn", e.target.value)} />
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v as ServiceExtraStatus)}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Serviço relacionado">
                <Select value={form.serviceId} onValueChange={(v) => update("serviceId", v)}>
                  <SelectTrigger aria-label="Serviço relacionado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SERVICE}>Nenhum</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Tarefa relacionada">
                <Select value={form.taskId} onValueChange={(v) => update("taskId", v)}>
                  <SelectTrigger aria-label="Tarefa relacionada">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TASK}>Nenhuma</SelectItem>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Conteúdo relacionado">
                <Select value={form.contentId} onValueChange={(v) => update("contentId", v)}>
                  <SelectTrigger aria-label="Conteúdo relacionado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CONTENT}>Nenhum</SelectItem>
                    {contents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir registro"
        description="Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
