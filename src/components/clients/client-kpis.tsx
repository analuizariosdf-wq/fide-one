"use client";

import { Clock, DollarSign, Images, ListChecks } from "lucide-react";

import { contents } from "@/lib/mock-data/contents";
import { formatCurrencyBRL } from "@/lib/format";
import { StatCard } from "@/components/ui/stat-card";
import { MockModuleNotice } from "@/components/clients/mock-module-notice";

export function ClientKpis({
  clientId,
  monthlyFee,
  openTasksCount,
}: {
  clientId: string;
  monthlyFee: number;
  openTasksCount: number;
}) {
  const clientContents = contents.filter((content) => content.clientId === clientId);
  const awaitingApproval = clientContents.filter((content) => content.status === "aprovacao");

  return (
    <div className="flex flex-col gap-3">
      {/* Publicações/Aguardando aprovação vêm de Conteúdos, que ainda é mock —
          "Tarefas abertas" (Fase 5.4) e "Receita mensal" já são dados reais. */}
      <MockModuleNotice module="Publicações e aguardando aprovação" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Publicações"
          value={String(clientContents.length)}
          helperText="este mês"
          icon={Images}
        />
        <StatCard
          label="Tarefas abertas"
          value={String(openTasksCount)}
          icon={ListChecks}
        />
        <StatCard
          label="Aguardando aprovação"
          value={String(awaitingApproval.length)}
          helperTone={awaitingApproval.length > 0 ? "warning" : "neutral"}
          icon={Clock}
        />
        <StatCard
          label="Receita mensal"
          value={formatCurrencyBRL(monthlyFee)}
          icon={DollarSign}
        />
      </div>
    </div>
  );
}
