"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Content } from "@/lib/types";
import { useContents, filterContents, removeContent, type ContentFilters } from "@/lib/data/contents";
import { useTasks } from "@/lib/data/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentFiltersBar } from "@/components/contents/content-filters";
import { ContentTable } from "@/components/contents/content-table";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";

export default function ContentsPage() {
  const [filters, setFilters] = useState<ContentFilters>({});
  const { contents, clients, projects, profiles, loading, error, refetch } = useContents();
  const { tasks } = useTasks();
  const filteredContents = useMemo(() => filterContents(contents, filters), [contents, filters]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);

  async function handleConfirmDelete() {
    if (!deletingContent) return;
    try {
      await removeContent(deletingContent.id);
      toast.success("Conteúdo excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o conteúdo. Tente novamente.");
    }
  }

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

      <ContentFiltersBar filters={filters} onChange={setFilters} clients={clients} projects={projects} profiles={profiles} />

      <Card>
        <CardContent className="pt-5">
          {error ? (
            <ErrorState description={error} onRetry={refetch} />
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <ContentTable
              contents={filteredContents}
              clients={clients}
              projects={projects}
              profiles={profiles}
              onEdit={(content) => {
                setEditingContent(content);
                setDrawerOpen(true);
              }}
              onDelete={(content) => setDeletingContent(content)}
            />
          )}
        </CardContent>
      </Card>

      <ContentFormDrawer
        key={editingContent?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        content={editingContent}
        clients={clients}
        projects={projects}
        profiles={profiles}
        tasks={tasks}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingContent)}
        onOpenChange={(open) => !open && setDeletingContent(null)}
        title="Excluir conteúdo"
        description={`Tem certeza que deseja excluir "${deletingContent?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
