import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Honest teaser, not a chatbot — src/lib/ai/ documents the boundary this
 * will eventually plug into (clients/tasks/contents/calendar/CRM/tickets/
 * reports, finance only when explicitly authorized). No provider chosen,
 * no key, nothing active yet.
 */
export default function AssistenteIaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assistente IA" description="Um assistente para o FIDE ONE, a caminho." />
      <EmptyState
        icon={Sparkles}
        title="Assistente IA — futuro"
        description="Esta área está reservada para um assistente que vai poder consultar clientes, tarefas, conteúdos, calendário, CRM, tickets e relatórios — respeitando as permissões de cada pessoa. Ainda não há nenhuma IA ativa."
      />
    </div>
  );
}
