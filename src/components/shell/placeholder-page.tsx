import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderPage({
  icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1>{title}</h1>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <EmptyState
        icon={icon}
        title="Módulo em construção"
        description="Este módulo será implementado em uma próxima etapa do FIDE ONE."
      />
    </div>
  );
}
