"use client";

import { useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

import type { FinancialTransaction } from "@/lib/types";
import {
  useFinancialData,
  filterTransactions,
  removeTransaction,
  setTransactionPaid,
  useCashFlowSummary,
  type FinancialFilters,
} from "@/lib/data/financial";
import { formatCurrencyBRL } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { FinanceiroFiltersBar } from "@/components/financeiro/financeiro-filters";
import { TransactionTable } from "@/components/financeiro/transaction-table";
import { TransactionFormDrawer } from "@/components/financeiro/transaction-form-drawer";

export default function FinanceiroPage() {
  const [filters, setFilters] = useState<FinancialFilters>({});
  const { transactions, categories, clients, loading, error, refetch } = useFinancialData();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, categoryById, filters),
    [transactions, categoryById, filters],
  );
  const summary = useCashFlowSummary(transactions, categories);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FinancialTransaction | null>(null);

  async function handleTogglePaid(transaction: FinancialTransaction) {
    try {
      await setTransactionPaid(transaction.id, transaction.status !== "pago");
      toast.success(transaction.status === "pago" ? "Lançamento marcado como pendente." : "Lançamento marcado como pago.");
      refetch();
    } catch {
      toast.error("Não foi possível atualizar o pagamento. Tente novamente.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTransaction) return;
    try {
      await removeTransaction(deletingTransaction.id);
      toast.success("Lançamento excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o lançamento. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Contas a receber, contas a pagar e fluxo de caixa da agência."
        action={
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Entradas" value={formatCurrencyBRL(summary.entradas)} icon={TrendingUp} />
            <StatCard label="Saídas" value={formatCurrencyBRL(summary.saidas)} icon={TrendingDown} />
            <StatCard
              label="Saldo"
              value={formatCurrencyBRL(summary.saldo)}
              icon={Wallet}
              helperText={summary.saldo < 0 ? "Negativo no período" : "Positivo no período"}
              helperTone={summary.saldo < 0 ? "danger" : "success"}
            />
            <StatCard label="A receber" value={formatCurrencyBRL(summary.aReceber)} />
            <StatCard label="A pagar" value={formatCurrencyBRL(summary.aPagar)} />
          </div>

          {summary.vencidasCount > 0 && (
            <Card className="border-status-danger-fg/30 bg-status-danger-bg">
              <CardContent className="py-3 text-[13px] font-medium text-status-danger-fg">
                {summary.vencidasCount} lançamento{summary.vencidasCount > 1 ? "s" : ""} vencido
                {summary.vencidasCount > 1 ? "s" : ""} — {formatCurrencyBRL(summary.vencidas)} no total.
              </CardContent>
            </Card>
          )}

          <FinanceiroFiltersBar filters={filters} onChange={setFilters} categories={categories} clients={clients} />

          <Card>
            <CardContent className="pt-5">
              <TransactionTable
                transactions={filteredTransactions}
                categories={categories}
                clients={clients}
                onEdit={(transaction) => {
                  setEditingTransaction(transaction);
                  setDrawerOpen(true);
                }}
                onDelete={(transaction) => setDeletingTransaction(transaction)}
                onTogglePaid={handleTogglePaid}
              />
            </CardContent>
          </Card>
        </>
      )}

      <TransactionFormDrawer
        key={editingTransaction?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transaction={editingTransaction}
        categories={categories}
        clients={clients}
        onSaved={refetch}
        onCategoryCreated={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        title="Excluir lançamento"
        description={`Tem certeza que deseja excluir "${deletingTransaction?.description}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
