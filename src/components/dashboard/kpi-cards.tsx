import { Images, ListChecks, Wallet } from "lucide-react";

import { formatCurrencyBRL } from "@/lib/format";
import { StatCard } from "@/components/ui/stat-card";

interface KpiCardsProps {
  tasksValue: number;
  tasksHelper: string;
  tasksOverdue: boolean;
  contentsValue: number;
  contentsHelper: string;
  receivableValue: number;
  payableValue: number;
  overdueTransactionsCount: number;
}

export function KpiCards({
  tasksValue,
  tasksHelper,
  tasksOverdue,
  contentsValue,
  contentsHelper,
  receivableValue,
  payableValue,
  overdueTransactionsCount,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Tarefas"
        value={String(tasksValue)}
        helperText={tasksHelper}
        helperTone={tasksOverdue ? "danger" : "neutral"}
        icon={ListChecks}
      />
      <StatCard
        label="Conteúdos"
        value={String(contentsValue)}
        helperText={contentsHelper}
        helperTone="neutral"
        icon={Images}
      />
      <StatCard
        label="A receber"
        value={formatCurrencyBRL(receivableValue)}
        helperText={
          overdueTransactionsCount > 0
            ? `${overdueTransactionsCount} vencido${overdueTransactionsCount > 1 ? "s" : ""}`
            : `${formatCurrencyBRL(payableValue)} a pagar`
        }
        helperTone={overdueTransactionsCount > 0 ? "danger" : "neutral"}
        icon={Wallet}
      />
    </div>
  );
}
