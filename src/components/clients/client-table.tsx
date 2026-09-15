"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";

import type { Client } from "@/lib/types";
import { getTeamMember } from "@/lib/mock-data/users";
import { formatCurrencyBRL } from "@/lib/format";
import { clientStatusConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  loading?: boolean;
}

export function ClientTable({ clients, onEdit, onDelete, loading }: ClientTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title="Nenhum cliente encontrado"
        description="Ajuste os filtros ou cadastre um novo cliente."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Serviços</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Mensalidade</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const responsible = getTeamMember(client.responsibleId);
          const status = clientStatusConfig[client.status];

          return (
            <TableRow
              key={client.id}
              className="cursor-pointer"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <TableCell className="font-medium text-foreground">
                {client.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.services.join(" · ") || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {responsible?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCurrencyBRL(client.monthlyFee)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ações do cliente"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(client)}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
