"use client";

import type { CalendarItem } from "@/lib/types";
import { getClient } from "@/lib/mock-data/clients";
import { formatDateShort } from "@/lib/format";
import { calendarItemKindConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityLink } from "@/components/shared/entity-link";

interface EventDetailDialogProps {
  item: CalendarItem | null;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDialog({ item, onOpenChange }: EventDetailDialogProps) {
  const event = item?.sourceEvent;
  const client = event?.clientId ? getClient(event.clientId) : undefined;
  const meta = item ? calendarItemKindConfig[item.kind] : undefined;

  return (
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
            {client && (
              <p className="text-[13px] text-muted-foreground">
                Cliente: <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
