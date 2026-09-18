"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon } from "lucide-react";

import type { ClientOption, ProfileOption, Ticket } from "@/lib/data/tickets";
import { ticketPriorityConfig, ticketStatusConfig } from "@/lib/data/tickets";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/shared/entity-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TicketTableProps {
  tickets: Ticket[];
  clients: ClientOption[];
  profiles: ProfileOption[];
}

export function TicketTable({ tickets, clients, profiles }: TicketTableProps) {
  const router = useRouter();
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  if (tickets.length === 0) {
    return <EmptyState icon={TicketIcon} title="Nenhum ticket encontrado" description="Crie o primeiro chamado interno." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prazo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => {
          const client = ticket.clientId ? clientById.get(ticket.clientId) : undefined;
          const assignee = ticket.assigneeId ? profileById.get(ticket.assigneeId) : undefined;
          const priority = ticketPriorityConfig[ticket.priority];
          const status = ticketStatusConfig[ticket.status];

          return (
            <TableRow key={ticket.id} className="cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
              <TableCell className="font-medium text-foreground">{ticket.title}</TableCell>
              <TableCell>
                {client ? <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink> : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{assignee?.name ?? "Sem responsável"}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <span className={cn("size-2 shrink-0 rounded-full", priority.dotClass)} aria-hidden />
                  {priority.label}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{ticket.dueDate ? formatDateShort(ticket.dueDate) : "—"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
