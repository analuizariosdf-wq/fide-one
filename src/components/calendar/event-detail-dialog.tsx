"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import type { CalendarItem } from "@/lib/types";
import type { ClientOption, ProjectOption } from "@/lib/data/tasks";
import { removeCalendarEvent } from "@/lib/data/calendar";
import { formatDateShort } from "@/lib/format";
import { calendarItemKindConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntityLink } from "@/components/shared/entity-link";
import { EventFormDrawer } from "@/components/calendar/event-form-drawer";

interface EventDetailDialogProps {
  item: CalendarItem | null;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  projects: ProjectOption[];
  onChanged?: () => void;
}

export function EventDetailDialog({ item, onOpenChange, clients, projects, onChanged }: EventDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const event = item?.sourceEvent;
  const client = event?.clientId ? clients.find((c) => c.id === event.clientId) : undefined;
  const project = event?.projectId ? projects.find((p) => p.id === event.projectId) : undefined;
  const meta = item ? calendarItemKindConfig[item.kind] : undefined;

  async function handleConfirmDelete() {
    if (!event) return;
    try {
      await removeCalendarEvent(event.id);
      toast.success("Evento excluído.");
      onOpenChange(false);
      onChanged?.();
    } catch {
      toast.error("Não foi possível excluir o evento. Tente novamente.");
    }
  }

  return (
    <>
      <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          {item && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {meta && <Badge variant="neutral">{meta.label}</Badge>}
                  <span className="text-[13px] text-muted-foreground">
                    {formatDateShort(item.date)}
                    {item.time ? ` · ${item.time}` : ""}
                  </span>
                </div>
                <DialogTitle>{item.title}</DialogTitle>
                {event?.description && (
                  <DialogDescription>{event.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="flex flex-col gap-1">
                {client && (
                  <p className="text-[13px] text-muted-foreground">
                    Cliente: <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
                  </p>
                )}
                {project && (
                  <p className="text-[13px] text-muted-foreground">
                    Projeto: <EntityLink href={`/projects/${project.id}`}>{project.name}</EntityLink>
                  </p>
                )}
              </div>
              {event && (
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-3.5" />
                    Excluir
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {event && (
        <EventFormDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          event={event}
          clients={clients}
          projects={projects}
          onSaved={() => {
            onOpenChange(false);
            onChanged?.();
          }}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir evento"
        description={`Tem certeza que deseja excluir "${event?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
