"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Project } from "@/lib/types";
import { useProjects, type ProjectFilters, removeProject } from "@/lib/services/projects-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectFiltersBar } from "@/components/projects/project-filters";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";

export default function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const projects = useProjects(filters);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

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

      <ProjectFiltersBar filters={filters} onChange={setFilters} />

      <Card>
        <CardContent className="pt-5">
          <ProjectTable
            projects={projects}
            onEdit={(project) => {
              setEditingProject(project);
              setDrawerOpen(true);
            }}
            onDelete={(project) => setDeletingProject(project)}
          />
        </CardContent>
      </Card>

      <ProjectFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} project={editingProject} />

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${deletingProject?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deletingProject) return;
          removeProject(deletingProject.id);
          toast.success("Projeto excluído.");
        }}
      />
    </div>
  );
}
