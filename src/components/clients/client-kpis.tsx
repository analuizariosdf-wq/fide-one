"use client";

import { useMemo } from "react";
import { Clock, DollarSign, Images, ListChecks } from "lucide-react";

import type { Content } from "@/lib/types";
import { MOCK_TODAY, formatCurrencyBRL } from "@/lib/format";
import { StatCard } from "@/components/ui/stat-card";

export function ClientKpis({
  monthlyFee,
  openTasksCount,
  contents,
}: {
  monthlyFee: number;
  openTasksCount: number;
  contents: Content[];
}) {
  const currentMonthKey = MOCK_TODAY.toISOString().slice(0, 7);
  const thisMonthContents = useMemo(
    () => contents.filter((content) => content.publishDate.startsWith(currentMonthKey)),
    [contents, currentMonthKey],
  );
  const awaitingApproval = useMemo(
    () => contents.filter((content) => content.status === "aprovacao"),
    [contents],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Publicações"
        value={String(thisMonthContents.length)}
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
  );
}
