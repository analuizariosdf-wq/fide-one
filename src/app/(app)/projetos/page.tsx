import { FolderKanban } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function ProjetosPage() {
  return (
    <PlaceholderPage
      icon={FolderKanban}
      title="Projetos"
      description="Planejamento e acompanhamento dos projetos em andamento."
    />
  );
}
