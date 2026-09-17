"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Project } from "@/lib/types";
import { useProjects, filterProjects, removeProject, type ProjectFilters } from "@/lib/data/projects";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectFiltersBar } from "@/components/projects/project-filters";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";

export default function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const { projects, clients, profiles, loading, error, refetch } = useProjects();
  const filteredProjects = useMemo(() => filterProjects(projects, filters), [projects, filters]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  async function handleConfirmDelete() {
    if (!deletingProject) return;
    try {
      await removeProject(deletingProject.id);
      toast.success("Projeto excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o projeto. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projetos"
        description="Organize as entregas da Fide por cliente e iniciativa."
        action={
          <Button
            onClick={() => {
              setEditingProject(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo projeto
          </Button>
        }
      />

      <ProjectFiltersBar filters={filters} onChange={setFilters} clients={clients} profiles={profiles} />

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
            <ProjectTable
              projects={filteredProjects}
              clients={clients}
              profiles={profiles}
              onEdit={(project) => {
                setEditingProject(project);
                setDrawerOpen(true);
              }}
              onDelete={(project) => setDeletingProject(project)}
            />
          )}
        </CardContent>
      </Card>

      <ProjectFormDrawer
        key={editingProject?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        project={editingProject}
        clients={clients}
        profiles={profiles}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${deletingProject?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
