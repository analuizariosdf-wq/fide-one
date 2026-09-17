import { Activity } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * No module writes to activity_logs yet (schema-only since a Etapa 4 — see
 * docs/project-status.md), so there is no real feed to show here. Honest
 * "not available yet" beats showing the old mocked activity list as if it
 * were real.
 */
export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Activity}
          title="Ainda não disponível"
          description="O histórico de atividade (activity_logs) será implementado em uma etapa futura."
        />
      </CardContent>
    </Card>
  );
}
