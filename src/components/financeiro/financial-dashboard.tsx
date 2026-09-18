"use client";

import { useMemo, useState } from "react";

import type { Contract } from "@/lib/data/contracts";
import { computePredictability } from "@/lib/data/predictability";
import type { FinancialCategory, FinancialTransaction } from "@/lib/types";
import type { CashFlowSummary } from "@/lib/data/financial";
import { formatCurrencyBRL, formatDateShort, MOCK_TODAY } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityLink } from "@/components/shared/entity-link";

interface ClientOption {
  id: string;
  name: string;
}

interface FinancialDashboardProps {
  summary: CashFlowSummary;
  contracts: Contract[];
  transactions: FinancialTransaction[];
  categoriesById: Map<string, FinancialCategory>;
  clients: ClientOption[];
}

const WINDOWS = [3, 6, 12];

export function FinancialDashboard({ summary, contracts, transactions, categoriesById, clients }: FinancialDashboardProps) {
  const [months, setMonths] = useState(3);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const window = useMemo(
    () => computePredictability(contracts, transactions, categoriesById, months, MOCK_TODAY),
    [contracts, transactions, categoriesById, months],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="A receber" value={formatCurrencyBRL(summary.aReceber)} />
        <StatCard label="A pagar" value={formatCurrencyBRL(summary.aPagar)} />
        <StatCard label="Recebido" value={formatCurrencyBRL(summary.entradas)} />
        <StatCard label="Pago" value={formatCurrencyBRL(summary.saidas)} />
        <StatCard label="Saldo" value={formatCurrencyBRL(summary.saldo)} helperTone={summary.saldo < 0 ? "danger" : "success"} />
        <StatCard
          label="Vencidos"
          value={formatCurrencyBRL(summary.vencidas)}
          helperText={`${summary.vencidasCount} lançamento${summary.vencidasCount !== 1 ? "s" : ""}`}
          helperTone={summary.vencidasCount > 0 ? "danger" : "neutral"}
        />
        <StatCard label="Contratos ativos" value={String(window.activeContractsCount)} />
        <StatCard label="MRR (receita recorrente)" value={formatCurrencyBRL(window.mrr)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previsibilidade</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Tabs value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <TabsList>
              {WINDOWS.map((w) => (
                <TabsTrigger key={w} value={String(w)}>
                  {w} meses
                </TabsTrigger>
              ))}
            </TabsList>
            {WINDOWS.map((w) => (
              <TabsContent key={w} value={String(w)} className="pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Receita recorrente prevista" value={formatCurrencyBRL(window.projectedRecurringRevenue)} />
                  <StatCard label="Contas a receber no período" value={formatCurrencyBRL(window.pendingReceivables)} />
                  <StatCard
                    label="Receita em risco"
                    value={formatCurrencyBRL(window.atRiskMonthlyRevenue)}
                    helperText="MRR de contratos que encerram no período"
                    helperTone={window.atRiskMonthlyRevenue > 0 ? "warning" : "neutral"}
                  />
                  <StatCard label="Contratos encerrando" value={String(window.endingContracts.length)} />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {window.endingContracts.length === 0 ? (
            <EmptyState title="Nenhum contrato encerrando neste período" description="Boa notícia — a receita recorrente atual segue estável." />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-medium text-foreground">Contratos encerrando no período</p>
              {window.endingContracts.map((contract) => {
                const client = clientById.get(contract.clientId);
                return (
                  <div key={contract.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-[13px]">
                    <span>
                      {client ? <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink> : "Cliente"} — encerra em{" "}
                      {contract.endDate ? formatDateShort(contract.endDate) : "—"}
                    </span>
                    <Badge variant="warning">
                      {contract.monthlyValue ? formatCurrencyBRL(contract.monthlyValue) : "—"}/{contract.billingPeriod}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
