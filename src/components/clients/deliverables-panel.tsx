"use client";

import { useState } from "react";
import { Pencil, PackageCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useDeliverables,
  createDeliverable,
  updateDeliverable,
  removeDeliverable,
  type Deliverable,
  type DeliverableBillingPeriod,
  type DeliverableStatus,
} from "@/lib/data/deliverables";
import type { Product } from "@/lib/data/products";
import type { Contract } from "@/lib/data/contracts";
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
const NO_CONTRACT = "nenhum";

const billingPeriodLabels: Record<DeliverableBillingPeriod, string> = {
  unico: "Único",
  semanal: "Semanal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

const statusLabels: Record<DeliverableStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

interface FormState {
  name: string;
  serviceId: string;
  contractId: string;
  quantity: string;
  billingPeriod: DeliverableBillingPeriod;
  startDate: string;
  endDate: string;
  status: DeliverableStatus;
  deliveredCount: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    serviceId: NO_SERVICE,
    contractId: NO_CONTRACT,
    quantity: "1",
    billingPeriod: "mensal",
    startDate: "",
    endDate: "",
    status: "ativo",
    deliveredCount: "0",
    notes: "",
  };
}

function toFormState(d: Deliverable): FormState {
  return {
    name: d.name,
    serviceId: d.serviceId ?? NO_SERVICE,
    contractId: d.contractId ?? NO_CONTRACT,
    quantity: String(d.quantity),
    billingPeriod: d.billingPeriod,
    startDate: d.startDate ?? "",
    endDate: d.endDate ?? "",
    status: d.status,
    deliveredCount: String(d.deliveredCount),
    notes: d.notes ?? "",
  };
}

interface DeliverablesPanelProps {
  clientId: string;
  services: Product[];
  contracts: Contract[];
}

/**
 * "Entregáveis/Escopo Contratado" — CRUD against the real `deliverables`
 * table, never auto-seeded. Contratado/Entregue/Pendente shown per row;
 * delivered_count is a manual counter (see the migration's own comment),
 * not computed from Contents/Tasks, since there's no reliable link yet.
 */
export function DeliverablesPanel({ clientId, services, contracts }: DeliverablesPanelProps) {
  const { deliverables, loading, error, refetch } = useDeliverables(clientId);
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<Deliverable | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(d: Deliverable) {
    setEditing(d);
    setForm(toFormState(d));
    setDialogOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do entregável.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        serviceId: form.serviceId === NO_SERVICE ? null : form.serviceId,
        contractId: form.contractId === NO_CONTRACT ? null : form.contractId,
        quantity: Math.max(0, Number(form.quantity) || 0),
        billingPeriod: form.billingPeriod,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
        deliveredCount: Math.max(0, Number(form.deliveredCount) || 0),
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await updateDeliverable(editing.id, payload);
        toast.success("Entregável atualizado.");
      } else {
        await createDeliverable(clientId, payload);
        toast.success("Entregável criado.");
      }
      setDialogOpen(false);
      refetch();
    } catch {
      toast.error("Não foi possível salvar o entregável.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await removeDeliverable(deleting.id);
      toast.success("Entregável excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o entregável.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entregáveis / Escopo contratado</CardTitle>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" />
          Novo entregável
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
        ) : deliverables.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Nenhum entregável cadastrado"
            description="Cadastre o escopo contratado para acompanhar o que já foi entregue."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {deliverables.map((d) => {
              const pending = Math.max(0, d.quantity - d.deliveredCount);
              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground">{d.name}</p>
                      <Badge variant="outline">{billingPeriodLabels[d.billingPeriod]}</Badge>
                      <Badge variant={d.status === "ativo" ? "success" : d.status === "pausado" ? "warning" : "neutral"}>
                        {statusLabels[d.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                      {d.serviceId && <span>{serviceById.get(d.serviceId)?.name ?? "Serviço"}</span>}
                      <span>Contratado: {d.quantity}</span>
                      <span>Entregue: {d.deliveredCount}</span>
                      <span className={pending > 0 ? "font-medium text-status-warning-fg" : ""}>
                        Pendente: {pending}
                      </span>
                      {(d.startDate || d.endDate) && (
                        <span>
                          {d.startDate ? formatDateShort(d.startDate) : "—"} até {d.endDate ? formatDateShort(d.endDate) : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(d)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDeleting(d)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar entregável" : "Novo entregável"}</DialogTitle>
            <DialogDescription>Escopo contratado para este cliente.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <FormField label="Nome" required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Serviço">
                <Select value={form.serviceId} onValueChange={(v) => update("serviceId", v)}>
                  <SelectTrigger aria-label="Serviço">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SERVICE}>Sem serviço</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Contrato relacionado">
                <Select value={form.contractId} onValueChange={(v) => update("contractId", v)}>
                  <SelectTrigger aria-label="Contrato relacionado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CONTRACT}>Sem contrato</SelectItem>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        Contrato desde {formatDateShort(c.startDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Quantidade contratada">
                <Input type="number" min={0} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
              </FormField>
              <FormField label="Entregue até agora">
                <Input
                  type="number"
                  min={0}
                  value={form.deliveredCount}
                  onChange={(e) => update("deliveredCount", e.target.value)}
                />
              </FormField>
              <FormField label="Periodicidade">
                <Select value={form.billingPeriod} onValueChange={(v) => update("billingPeriod", v as DeliverableBillingPeriod)}>
                  <SelectTrigger aria-label="Periodicidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(billingPeriodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v as DeliverableStatus)}>
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
              <FormField label="Início">
                <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </FormField>
              <FormField label="Fim">
                <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Observações">
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir entregável"
        description={`Tem certeza que deseja excluir "${deleting?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
