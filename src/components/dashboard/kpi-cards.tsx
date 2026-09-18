import { CheckCircle2, Images, ListChecks } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

interface KpiCardsProps {
  tasksValue: number;
  tasksHelper: string;
  tasksOverdue: boolean;
  contentsValue: number;
  contentsHelper: string;
  awaitingApprovalValue: number;
}

/** Operational only, on purpose — no financial figure belongs on the general Dashboard. See Financeiro's own dashboard for money. */
export function KpiCards({
  tasksValue,
  tasksHelper,
  tasksOverdue,
  contentsValue,
  contentsHelper,
  awaitingApprovalValue,
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
        label="Aguardando aprovação"
        value={String(awaitingApprovalValue)}
        helperText={awaitingApprovalValue > 0 ? "Requer revisão" : "Nada pendente"}
        helperTone={awaitingApprovalValue > 0 ? "warning" : "neutral"}
        icon={CheckCircle2}
      />
    </div>
  );
}
