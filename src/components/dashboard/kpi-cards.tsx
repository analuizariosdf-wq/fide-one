import { Images, ListChecks, Wallet } from "lucide-react";

import { formatCurrencyBRL } from "@/lib/format";
import type { dashboardStats } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/stat-card";

export function KpiCards({ stats }: { stats: typeof dashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Tarefas"
        value={String(stats.tasks.value)}
        helperText={stats.tasks.helper}
        helperTone="danger"
        icon={ListChecks}
      />
      <StatCard
        label="Conteúdos"
        value={String(stats.contents.value)}
        helperText={stats.contents.helper}
        helperTone="neutral"
        icon={Images}
      />
      <StatCard
        label="A receber"
        value={formatCurrencyBRL(stats.receivable.value)}
        helperText={stats.receivable.helper}
        helperTone="neutral"
        icon={Wallet}
      />
    </div>
  );
}
