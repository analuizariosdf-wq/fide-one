"use client";

import { Clock, DollarSign, Images, ListChecks } from "lucide-react";

import { contents } from "@/lib/mock-data/contents";
import { formatCurrencyBRL } from "@/lib/format";
import { useTasks } from "@/lib/services/tasks-service";
import { StatCard } from "@/components/ui/stat-card";

export function ClientKpis({
  clientId,
  monthlyFee,
}: {
  clientId: string;
  monthlyFee: number;
}) {
  const openTasks = useTasks({ clientId }).filter((task) => task.status !== "concluido");
  const clientContents = contents.filter((content) => content.clientId === clientId);
  const awaitingApproval = clientContents.filter((content) => content.status === "aprovacao");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Publicações"
        value={String(clientContents.length)}
        helperText="este mês"
        icon={Images}
      />
      <StatCard
        label="Tarefas abertas"
        value={String(openTasks.length)}
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
  );
}
