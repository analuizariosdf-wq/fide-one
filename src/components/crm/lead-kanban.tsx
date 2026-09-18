"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { Lead, Stage } from "@/lib/data/crm";
import { moveLeadToStage } from "@/lib/data/crm";
import { formatCurrencyBRL, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileOption {
  id: string;
  name: string;
}

interface LeadKanbanProps {
  stages: Stage[];
  leads: Lead[];
  profiles: ProfileOption[];
  canManage: boolean;
  onOpenLead: (lead: Lead) => void;
  onCreateLead: (stageId: string) => void;
  onChanged: () => void;
}

/**
 * Native HTML5 drag-and-drop (draggable + dataTransfer) — no extra
 * dependency, same reasoning as the Client Workspace kanban.
 */
export function LeadKanban({ stages, leads, profiles, canManage, onOpenLead, onCreateLead, onChanged }: LeadKanbanProps) {
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  async function handleDrop(stage: Stage) {
    setDragOverStageId(null);
    if (!dragLeadId) return;
    const lead = leads.find((l) => l.id === dragLeadId);
    setDragLeadId(null);
    if (!lead || lead.stageId === stage.id) return;
    try {
      await moveLeadToStage(lead.id, lead.stageId, stage.id);
      onChanged();
    } catch {
      // onChanged() re-fetches; a failed move just leaves the card where it was.
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const stageLeads = leads.filter((l) => l.stageId === stage.id);
        const stageValue = stageLeads.reduce((sum, l) => sum + (l.expectedValue ?? 0), 0);

        return (
          <div
            key={stage.id}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2.5",
              dragOverStageId === stage.id && "ring-2 ring-primary",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={() => setDragOverStageId((current) => (current === stage.id ? null : current))}
            onDrop={() => handleDrop(stage)}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-[13px] font-semibold text-foreground">{stage.name}</span>
                <span className="text-[12px] text-muted-foreground">({stageLeads.length})</span>
              </div>
              {canManage && (
                <Button variant="ghost" size="icon" className="size-6" aria-label={`Novo negócio em ${stage.name}`} onClick={() => onCreateLead(stage.id)}>
                  <Plus className="size-3.5" />
                </Button>
              )}
            </div>
            {stageValue > 0 && <p className="px-1 text-[12px] text-muted-foreground">{formatCurrencyBRL(stageValue)}</p>}

            <div className="flex flex-col gap-2">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable={canManage}
                  onDragStart={() => setDragLeadId(lead.id)}
                  onClick={() => onOpenLead(lead)}
                  className="cursor-pointer rounded-md border border-border bg-surface p-2.5 shadow-sm transition-colors hover:border-primary/40"
                >
                  <p className="truncate text-[13px] font-medium text-foreground">{lead.name}</p>
                  {lead.company && <p className="truncate text-[12px] text-muted-foreground">{lead.company}</p>}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {lead.expectedValue ? (
                      <span className="text-[12px] font-medium text-status-success-fg">{formatCurrencyBRL(lead.expectedValue)}</span>
                    ) : (
                      <span />
                    )}
                    {lead.responsibleId && (
                      <Badge variant="outline" className="text-[11px]">
                        {profileById.get(lead.responsibleId)?.name ?? "—"}
                      </Badge>
                    )}
                  </div>
                  {lead.expectedCloseDate && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Previsão: {formatDateShort(lead.expectedCloseDate)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
