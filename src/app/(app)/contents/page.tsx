"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Content } from "@/lib/types";
import { useContents, type ContentFilters, removeContent } from "@/lib/services/contents-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ContentFiltersBar } from "@/components/contents/content-filters";
import { ContentTable } from "@/components/contents/content-table";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";

export default function ContentsPage() {
  const [filters, setFilters] = useState<ContentFilters>({});
  const contents = useContents(filters);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conteúdos"
        description="Planeje, produza e acompanhe os conteúdos da Fide."
        action={
          <Button
            onClick={() => {
              setEditingContent(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo conteúdo
          </Button>
        }
      />

      <ContentFiltersBar filters={filters} onChange={setFilters} />

      <Card>
        <CardContent className="pt-5">
          <ContentTable
            contents={contents}
            onEdit={(content) => {
              setEditingContent(content);
              setDrawerOpen(true);
            }}
            onDelete={(content) => setDeletingContent(content)}
          />
        </CardContent>
      </Card>

      <ContentFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} content={editingContent} />

      <ConfirmDialog
        open={Boolean(deletingContent)}
        onOpenChange={(open) => !open && setDeletingContent(null)}
        title="Excluir conteúdo"
        description={`Tem certeza que deseja excluir "${deletingContent?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deletingContent) return;
          removeContent(deletingContent.id);
          toast.success("Conteúdo excluído.");
        }}
      />
    </div>
  );
}
