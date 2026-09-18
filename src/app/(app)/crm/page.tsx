"use client";

import { useMemo, useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { useCrmData, removeLead, type Lead } from "@/lib/data/crm";
import { useProducts } from "@/lib/data/products";
import { useTeam } from "@/lib/data/team";
import { useHasPermission } from "@/lib/auth/current-actor-context";
import { RequirePermission } from "@/components/shared/require-permission";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadKanban } from "@/components/crm/lead-kanban";
import { LeadFormDrawer } from "@/components/crm/lead-form-drawer";
import { PipelineManagerDialog } from "@/components/crm/pipeline-manager-dialog";

export default function CrmPage() {
  return (
    <RequirePermission permission="crm.view">
      <CrmContent />
    </RequirePermission>
  );
}

function CrmContent() {
  const canManage = useHasPermission("crm.manage");
  const { pipelines, stages, leads, loading, error, refetch } = useCrmData();
  const { products } = useProducts();
  const { team } = useTeam();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const pipelineId = selectedPipelineId ?? pipelines[0]?.id ?? null;

  const [managerOpen, setManagerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string>("");
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const pipelineStages = useMemo(
    () => stages.filter((s) => s.pipelineId === pipelineId).sort((a, b) => a.position - b.position),
    [stages, pipelineId],
  );
  const pipelineLeads = useMemo(() => leads.filter((l) => l.pipelineId === pipelineId), [leads, pipelineId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comercial"
        description="CRM personalizável — pipelines, etapas e negócios."
        action={
          canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setManagerOpen(true)}>
                <Settings2 className="size-4" />
                Gerenciar pipelines
              </Button>
              {pipelineId && (
                <Button
                  onClick={() => {
                    setEditingLead(null);
                    setDefaultStageId(pipelineStages[0]?.id ?? "");
                    setDrawerOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Novo negócio
                </Button>
              )}
            </div>
          )
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : pipelines.length === 0 ? (
        <EmptyState
          title="Nenhum pipeline cadastrado"
          description="Crie o primeiro pipeline para começar a organizar seus negócios."
          action={canManage ? <Button onClick={() => setManagerOpen(true)}>Criar pipeline</Button> : undefined}
        />
      ) : (
        <>
          {pipelines.length > 1 && (
            <Select value={pipelineId ?? undefined} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-56" aria-label="Pipeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {pipelineStages.length === 0 ? (
            <EmptyState title="Este pipeline ainda não tem etapas" description="Adicione etapas em 'Gerenciar pipelines'." />
          ) : (
            <LeadKanban
              stages={pipelineStages}
              leads={pipelineLeads}
              profiles={team}
              canManage={canManage}
              onOpenLead={(lead) => {
                setEditingLead(lead);
                setDrawerOpen(true);
              }}
              onCreateLead={(stageId) => {
                setEditingLead(null);
                setDefaultStageId(stageId);
                setDrawerOpen(true);
              }}
              onChanged={refetch}
            />
          )}
        </>
      )}

      {pipelineId && (
        <LeadFormDrawer
          key={editingLead?.id ?? "new-lead"}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          lead={editingLead}
          pipelineId={pipelineId}
          defaultStageId={defaultStageId}
          stages={pipelineStages}
          profiles={team}
          products={products}
          onSaved={refetch}
        />
      )}

      <PipelineManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        pipelines={pipelines}
        stages={stages}
        leads={leads}
        selectedPipelineId={pipelineId ?? ""}
        onChanged={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingLead)}
        onOpenChange={(open) => !open && setDeletingLead(null)}
        title="Excluir negócio"
        description="Tem certeza que deseja excluir este negócio? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingLead) return;
          try {
            await removeLead(deletingLead.id);
            toast.success("Negócio excluído.");
            refetch();
          } catch {
            toast.error("Não foi possível excluir o negócio.");
          }
        }}
      />
    </div>
  );
}
