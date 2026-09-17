"use client";

import { useMemo } from "react";
import { Check, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";

import type { FinancialCategory, FinancialTransaction } from "@/lib/types";
import { getEffectiveStatus, type ClientOption } from "@/lib/data/financial";
import { formatCurrencyBRL, formatDateShort } from "@/lib/format";
import { financialCategoryTypeConfig, financialTransactionStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
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

interface TransactionTableProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  clients: ClientOption[];
  hideClientColumn?: boolean;
  /** Hides the actions column — used by the read-only list in the client detail page. */
  readOnly?: boolean;
  onEdit?: (transaction: FinancialTransaction) => void;
  onDelete?: (transaction: FinancialTransaction) => void;
  onTogglePaid?: (transaction: FinancialTransaction) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TransactionTable({
  transactions,
  categories,
  clients,
  hideClientColumn,
  readOnly,
  onEdit,
  onDelete,
  onTogglePaid,
  emptyTitle = "Nenhum lançamento encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo lançamento.",
}: TransactionTableProps) {
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  if (transactions.length === 0) {
    return <EmptyState icon={Wallet} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          {!hideClientColumn && <TableHead>Cliente</TableHead>}
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {!readOnly && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const category = transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined;
          const client = transaction.clientId ? clientById.get(transaction.clientId) : undefined;
          const effectiveStatus = getEffectiveStatus(transaction);
          const status = financialTransactionStatusConfig[effectiveStatus];
          const isPaid = transaction.status === "pago";
          const isReceita = category?.type === "receita";

          return (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium text-foreground">{transaction.description}</TableCell>
              <TableCell>
                {category ? (
                  <Badge variant={financialCategoryTypeConfig[category.type].variant}>{category.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              {!hideClientColumn && (
                <TableCell>
                  {client ? (
                    <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
                  ) : (
                    <span className="text-muted-foreground">Interno</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {transaction.dueDate ? formatDateShort(transaction.dueDate) : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium",
                  isReceita ? "text-status-success-fg" : "text-status-danger-fg",
                )}
              >
                {isReceita ? "+" : "-"}
                {formatCurrencyBRL(transaction.amount)}
              </TableCell>
              {!readOnly && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações do lançamento">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTogglePaid?.(transaction)}>
                        <Check className="size-3.5" />
                        {isPaid ? "Marcar como pendente" : isReceita ? "Marcar como recebido" : "Marcar como pago"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(transaction)}>
                        <Trash2 className="size-3.5" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
