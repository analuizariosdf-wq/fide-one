import { ListChecks } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function TarefasPage() {
  return (
    <PlaceholderPage
      icon={ListChecks}
      title="Tarefas"
      description="Todas as tarefas da operação, organizadas por responsável e prazo."
    />
  );
}
