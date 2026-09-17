"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Pencil, Plus, Trash2 } from "lucide-react";

import { formatDateShort } from "@/lib/format";
import { projectStatusConfig } from "@/lib/status";
import { useProject, removeProject } from "@/lib/data/projects";
import { useTasks, filterTasks, removeTask } from "@/lib/data/tasks";
import { useContents, filterContents, removeContent } from "@/lib/data/contents";
import type { Content, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntityLink } from "@/components/shared/entity-link";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";
import { ContentTable } from "@/components/contents/content-table";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";
import { EntityFilesPanel } from "@/components/files/entity-files-panel";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { project, clients, profiles, loading, error, refetch } = useProject(id);
  const {
    tasks: allTasks,
    clients: taskClients,
    projects: taskProjects,
    profiles: taskProfiles,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks();
  const projectTasks = useMemo(
    () => filterTasks(allTasks, { projectId: id }),
    [allTasks, id],
  );
  const {
    contents: allContents,
    clients: contentClients,
    projects: contentProjects,
    profiles: contentProfiles,
    loading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useContents();
  const projectContents = useMemo(
    () => filterContents(allContents, { projectId: id }),
    [allContents, id],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [contentDrawerOpen, setContentDrawerOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);

  const client = useMemo(
    () => (project ? clients.find((c) => c.id === project.clientId) : undefined),
    [clients, project],
  );
  const responsible = useMemo(
    () => (project ? profiles.find((p) => p.id === project.responsibleId) : undefined),
    [profiles, project],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  if (!project) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Projeto não encontrado"
        description="Ele pode ter sido excluído."
      />
    );
  }

  const status = projectStatusConfig[project.status];

  async function handleConfirmDelete() {
    if (!project) return;
    try {
      await removeProject(project.id);
      toast.success("Projeto excluído.");
      router.push("/projects");
    } catch {
      toast.error("Não foi possível excluir o projeto. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {client && (
            <EntityLink href={`/clients/${client.id}`} muted className="text-[13px]">
              {client.name}
            </EntityLink>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1>{project.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Progress value={project.progress} className="w-32" />
            <span className="text-[13px] text-muted-foreground">
              {project.progress}% concluído
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-5 py-4 sm:grid-cols-4">
        <MetaField label="Cliente" value={client?.name ?? "—"} />
        <MetaField label="Responsável" value={responsible?.name ?? "—"} />
        <MetaField
          label="Período"
          value={`${formatDateShort(project.startDate)} — ${formatDateShort(project.endDate)}`}
        />
        <MetaField label="Campanha" value={project.campaign ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {project.description || "Nenhuma descrição adicionada."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Tarefas do projeto</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTask(null);
              setTaskDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        </CardHeader>
        <CardContent>
          {tasksError ? (
            <ErrorState description={tasksError} onRetry={refetchTasks} />
          ) : tasksLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <TaskListView
              tasks={projectTasks}
              clients={taskClients}
              projects={taskProjects}
              profiles={taskProfiles}
              hideProjectColumn
              onEdit={(task) => {
                setEditingTask(task);
                setTaskDrawerOpen(true);
              }}
              onDelete={(task) => setDeletingTask(task)}
              emptyTitle="Nenhuma tarefa neste projeto"
              emptyDescription="Crie a primeira tarefa para começar a acompanhar a entrega."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdos relacionados</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingContent(null);
              setContentDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo conteúdo
          </Button>
        </CardHeader>
        <CardContent>
          {contentsError ? (
            <ErrorState description={contentsError} onRetry={refetchContents} />
          ) : contentsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <ContentTable
              contents={projectContents}
              clients={contentClients}
              projects={contentProjects}
              profiles={contentProfiles}
              hideClientColumn
              onEdit={(content) => {
                setEditingContent(content);
                setContentDrawerOpen(true);
              }}
              onDelete={(content) => setDeletingContent(content)}
              emptyTitle="Nenhum conteúdo relacionado a este projeto"
              emptyDescription="Crie o primeiro conteúdo para começar a planejar a produção."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityFilesPanel entityType="project" entityId={project.id} />
        </CardContent>
      </Card>

      <ProjectFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        clients={clients}
        profiles={profiles}
        onSaved={refetch}
      />

      <TaskFormDrawer
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
        task={editingTask}
        clients={taskClients}
        projects={taskProjects}
        profiles={taskProfiles}
        defaultClientId={project.clientId}
        defaultProjectId={project.id}
        onSaved={refetchTasks}
      />

      <ContentFormDrawer
        open={contentDrawerOpen}
        onOpenChange={setContentDrawerOpen}
        content={editingContent}
        clients={contentClients}
        projects={contentProjects}
        profiles={contentProfiles}
        tasks={allTasks}
        defaultClientId={project.clientId}
        defaultProjectId={project.id}
        onSaved={refetchContents}
      />

      <ConfirmDialog
        open={Boolean(deletingContent)}
        onOpenChange={(open) => !open && setDeletingContent(null)}
        title="Excluir conteúdo"
        description={`Tem certeza que deseja excluir "${deletingContent?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingContent) return;
          try {
            await removeContent(deletingContent.id);
            toast.success("Conteúdo excluído.");
            refetchContents();
          } catch {
            toast.error("Não foi possível excluir o conteúdo. Tente novamente.");
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingTask) return;
          try {
            await removeTask(deletingTask.id);
            toast.success("Tarefa excluída.");
            refetchTasks();
          } catch {
            toast.error("Não foi possível excluir a tarefa. Tente novamente.");
          }
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${project.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}
