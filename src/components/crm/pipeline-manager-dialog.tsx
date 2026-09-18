"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Lead, Pipeline, Stage } from "@/lib/data/crm";
import {
  createPipeline,
  createStage,
  removePipeline,
  removeStage,
  renamePipeline,
  reorderStages,
  updateStage,
} from "@/lib/data/crm";
import { getErrorMessage } from "@/lib/error-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PipelineManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelines: Pipeline[];
  stages: Stage[];
  leads: Lead[];
  selectedPipelineId: string;
  onChanged: () => void;
}

const STAGE_COLORS = ["#6B6B6B", "#5B3CC4", "#2563EB", "#16A34A", "#D97706", "#DC2626"];

export function PipelineManagerDialog({
  open,
  onOpenChange,
  pipelines,
  stages,
  leads,
  selectedPipelineId,
  onChanged,
}: PipelineManagerDialogProps) {
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null);

  const pipelineStages = stages.filter((s) => s.pipelineId === selectedPipelineId).sort((a, b) => a.position - b.position);

  async function handleCreatePipeline() {
    if (!newPipelineName.trim()) return;
    try {
      await createPipeline(newPipelineName.trim());
      setNewPipelineName("");
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível criar o pipeline."));
    }
  }

  async function handleDeletePipeline(pipeline: Pipeline) {
    const hasLeads = leads.some((l) => l.pipelineId === pipeline.id);
    if (hasLeads) {
      toast.error("Mova ou exclua os negócios deste pipeline antes de excluí-lo.");
      return;
    }
    try {
      await removePipeline(pipeline.id);
      onChanged();
    } catch {
      toast.error("Não foi possível excluir o pipeline.");
    }
  }

  async function handleCreateStage() {
    if (!newStageName.trim()) return;
    try {
      await createStage(
        selectedPipelineId,
        { name: newStageName.trim(), color: STAGE_COLORS[pipelineStages.length % STAGE_COLORS.length], isWon: false, isLost: false },
        pipelineStages.length,
      );
      setNewStageName("");
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível criar a etapa."));
    }
  }

  async function handleDeleteStage(stage: Stage) {
    const hasLeads = leads.some((l) => l.stageId === stage.id);
    if (hasLeads) {
      toast.error("Mova os negócios desta etapa antes de excluí-la.");
      return;
    }
    if (pipelineStages.length <= 1) {
      toast.error("O pipeline precisa de pelo menos uma etapa.");
      return;
    }
    try {
      await removeStage(stage.id);
      onChanged();
    } catch {
      toast.error("Não foi possível excluir a etapa.");
    }
  }

  async function handleRenameStage(stage: Stage, name: string) {
    try {
      await updateStage(stage.id, { name, color: stage.color, isWon: stage.isWon, isLost: stage.isLost });
      onChanged();
    } catch {
      toast.error("Não foi possível renomear a etapa.");
    }
  }

  async function handleColorChange(stage: Stage, color: string) {
    try {
      await updateStage(stage.id, { name: stage.name, color, isWon: stage.isWon, isLost: stage.isLost });
      onChanged();
    } catch {
      toast.error("Não foi possível alterar a cor.");
    }
  }

  async function handleDrop(targetStage: Stage) {
    if (!draggingStageId || draggingStageId === targetStage.id) return;
    const order = pipelineStages.map((s) => s.id);
    const fromIndex = order.indexOf(draggingStageId);
    const toIndex = order.indexOf(targetStage.id);
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, draggingStageId);
    setDraggingStageId(null);
    try {
      await reorderStages(order);
      onChanged();
    } catch {
      toast.error("Não foi possível reordenar as etapas.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar pipelines e etapas</DialogTitle>
          <DialogDescription>Crie, renomeie, reordene e exclua livremente — nada é fixo.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Pipelines</Label>
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                <Input
                  defaultValue={pipeline.name}
                  className="h-8 flex-1"
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && value !== pipeline.name) {
                      renamePipeline(pipeline.id, value)
                        .then(onChanged)
                        .catch(() => toast.error("Não foi possível renomear o pipeline."));
                    }
                  }}
                />
                <Button variant="ghost" size="icon" aria-label={`Excluir pipeline ${pipeline.name}`} onClick={() => handleDeletePipeline(pipeline)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Novo pipeline" value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} />
              <Button variant="outline" onClick={handleCreatePipeline}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Etapas do pipeline selecionado</Label>
            {pipelineStages.map((stage) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => setDraggingStageId(stage.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
                className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
              >
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground" />
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => handleColorChange(stage, e.target.value)}
                  className="size-6 shrink-0 cursor-pointer rounded border border-input"
                  aria-label={`Cor da etapa ${stage.name}`}
                />
                <Input
                  defaultValue={stage.name}
                  className="h-8 flex-1"
                  onBlur={(e) => e.target.value.trim() && handleRenameStage(stage, e.target.value.trim())}
                />
                <Button variant="ghost" size="icon" aria-label={`Excluir etapa ${stage.name}`} onClick={() => handleDeleteStage(stage)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Nova etapa" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} />
              <Button variant="outline" onClick={handleCreateStage}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
