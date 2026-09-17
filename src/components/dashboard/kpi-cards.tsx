import { Images, ListChecks, Wallet } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

interface KpiCardsProps {
  tasksValue: number;
  tasksHelper: string;
  tasksOverdue: boolean;
  contentsValue: number;
  contentsHelper: string;
}

export function KpiCards({ tasksValue, tasksHelper, tasksOverdue, contentsValue, contentsHelper }: KpiCardsProps) {
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
        value="—"
        helperText="Financeiro ainda não disponível"
        helperTone="neutral"
        icon={Wallet}
      />
    </div>
  );
}
