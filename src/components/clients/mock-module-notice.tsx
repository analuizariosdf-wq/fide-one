import { Info } from "lucide-react";

/**
 * Clientes is the only module wired to Supabase so far (Fase 5.2). This
 * flags cross-module data shown inside a real client's page (Projetos,
 * Tarefas, Conteúdos tabs, KPIs) that still comes from mock-data — so it's
 * never mistaken for what's actually stored for this client in the bank.
 */
export function MockModuleNotice({ module }: { module: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>
        {module} ainda usa dados de exemplo (mock), não o banco real — a conexão
        será feita em uma etapa futura.
      </span>
    </div>
  );
}
