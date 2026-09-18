"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { Content } from "@/lib/types";
import { updateContentStatus } from "@/lib/data/contents";
import { contentEditorialConfig, contentEditorialOrder } from "@/lib/status";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutGrid } from "lucide-react";

interface ProfileOption {
  id: string;
  name: string;
}

interface ClientWorkspaceKanbanProps {
  contents: Content[];
  profiles: ProfileOption[];
  onOpenContent: (content: Content) => void;
  onChanged: () => void;
}

/**
 * "Central do Cliente" — reuses real Contents filtered by client, no
 * duplication. Native HTML5 drag-and-drop (same pattern as the CRM
 * Kanban), moving a card only changes contents.status.
 */
export function ClientWorkspaceKanban({ contents, profiles, onOpenContent, onChanged }: ClientWorkspaceKanbanProps) {
  const [dragContentId, setDragContentId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  if (contents.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Nenhum conteúdo neste cliente"
        description="Crie o primeiro conteúdo para ver o workspace de produção."
      />
    );
  }

  async function handleDrop(status: (typeof contentEditorialOrder)[number]) {
    setDragOverStatus(null);
    if (!dragContentId) return;
    const content = contents.find((c) => c.id === dragContentId);
    setDragContentId(null);
    if (!content || content.status === status) return;
    try {
      await updateContentStatus(content.id, status);
      onChanged();
    } catch {
      toast.error("Não foi possível mover o conteúdo. Tente novamente.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {contentEditorialOrder.map((status) => {
        const columnContents = contents.filter((c) => c.status === status);
        const meta = contentEditorialConfig[status];

        return (
          <div
            key={status}
            className={cn(
              "flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2.5",
              dragOverStatus === status && "ring-2 ring-primary",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
            onDrop={() => handleDrop(status)}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[13px] font-semibold text-foreground">{meta.label}</h3>
              <span className="text-[12px] text-muted-foreground">{columnContents.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {columnContents.map((content) => (
                <div
                  key={content.id}
                  draggable
                  onDragStart={() => setDragContentId(content.id)}
                  onClick={() => onOpenContent(content)}
                  className="cursor-pointer rounded-md border border-border bg-surface p-2.5 shadow-sm transition-colors hover:border-primary/40"
                >
                  <p className="truncate text-[13px] font-medium text-foreground">{content.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {content.contentType} · {content.channel}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {content.publishDate ? formatDateShort(content.publishDate) : "Sem data"}
                    </span>
                    {content.responsibleId && (
                      <Badge variant="outline" className="text-[11px]">
                        {profileById.get(content.responsibleId)?.name ?? "—"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
