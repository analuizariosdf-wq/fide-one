"use client";

import { useMemo } from "react";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Contract } from "@/lib/data/contracts";
import type { Product } from "@/lib/data/products";
import { formatCurrencyBRL, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/shared/entity-link";
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

const STATUS_VARIANT = { ativo: "success", suspenso: "warning", encerrado: "neutral" } as const;

interface ClientOption {
  id: string;
  name: string;
}

interface ContractTableProps {
  contracts: Contract[];
  clients: ClientOption[];
  products: Product[];
  hideClientColumn?: boolean;
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
}

export function ContractTable({ contracts, clients, products, hideClientColumn, onEdit, onDelete }: ContractTableProps) {
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (contracts.length === 0) {
    return <EmptyState icon={FileText} title="Nenhum contrato cadastrado" description="Registre o tempo de contrato e o valor recorrente dos clientes." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!hideClientColumn && <TableHead>Cliente</TableHead>}
          <TableHead>Produto/serviço</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Fim</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Periodicidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((contract) => {
          const client = clientById.get(contract.clientId);
          const product = contract.serviceId ? productById.get(contract.serviceId) : undefined;
          return (
            <TableRow key={contract.id}>
              {!hideClientColumn && (
                <TableCell>
                  {client ? <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink> : "—"}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{product?.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateShort(contract.startDate)}</TableCell>
              <TableCell className="text-muted-foreground">
                {contract.endDate ? formatDateShort(contract.endDate) : "—"}
              </TableCell>
              <TableCell className="text-right">
                {contract.monthlyValue ? formatCurrencyBRL(contract.monthlyValue) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground capitalize">{contract.billingPeriod}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[contract.status]}>{contract.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações do contrato">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contract)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(contract)}>
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
