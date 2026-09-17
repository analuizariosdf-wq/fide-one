"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Pencil, Plus, Trash2 } from "lucide-react";

import type { Content, Project, Task } from "@/lib/types";
import { useClient, removeClient } from "@/lib/data/clients";
import { useProjects, filterProjects, removeProject } from "@/lib/data/projects";
import { useTasks, filterTasks, removeTask } from "@/lib/data/tasks";
import { useContents, removeContent } from "@/lib/services/contents-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientHeader } from "@/components/clients/client-header";
import { ClientKpis } from "@/components/clients/client-kpis";
import { MockModuleNotice } from "@/components/clients/mock-module-notice";
import { ClientFormDrawer } from "@/components/clients/client-form-drawer";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";
import { ContentTable } from "@/components/contents/content-table";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";

const PLACEHOLDER_TABS = [
  { value: "calendario", label: "Calendário", description: "O calendário integrado será conectado em uma próxima etapa." },
  { value: "aprovacoes", label: "Aprovações", description: "O fluxo de aprovações será implementado em uma próxima etapa." },
  { value: "financeiro", label: "Financeiro", description: "O histórico financeiro completo virá em uma próxima etapa." },
  { value: "arquivos", label: "Arquivos", description: "O repositório de arquivos será implementado em uma próxima etapa." },
];

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { client, profiles, services, loading, error, refetch } = useClient(id);
  const {
    projects: allProjects,
    clients: projectClients,
    profiles: projectProfiles,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects();
  const clientProjects = useMemo(
    () => filterProjects(allProjects, { clientId: id }),
    [allProjects, id],
  );
  const {
    tasks: allTasks,
    clients: taskClients,
    projects: taskProjects,
    profiles: taskProfiles,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks();
  const clientTasks = useMemo(() => filterTasks(allTasks, { clientId: id }), [allTasks, id]);
  const openTasksCount = useMemo(
    () => clientTasks.filter((task) => task.status !== "concluido" && task.status !== "cancelado").length,
    [clientTasks],
  );
  const clientContents = useContents({ clientId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [contentDrawerOpen, setContentDrawerOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  if (!client) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Cliente não encontrado"
        description="Ele pode ter sido excluído."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ClientHeader client={client} />
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

      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
          {PLACEHOLDER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao-geral" className="pt-4">
          <ClientKpis
            clientId={client.id}
            monthlyFee={client.monthlyFee}
            openTasksCount={openTasksCount}
          />

          {client.notes && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projetos" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Projetos</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingProject(null);
                  setProjectDrawerOpen(true);
                }}
              >
                <Plus className="size-4" />
                Novo projeto
              </Button>
            </CardHeader>
            <CardContent>
              {projectsError ? (
                <ErrorState description={projectsError} onRetry={refetchProjects} />
              ) : projectsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <ProjectTable
                  projects={clientProjects}
                  clients={projectClients}
                  profiles={projectProfiles}
                  hideClientColumn
                  onEdit={(project) => {
                    setEditingProject(project);
                    setProjectDrawerOpen(true);
                  }}
                  onDelete={(project) => setDeletingProject(project)}
                  emptyTitle="Você ainda não possui projetos neste cliente."
                  emptyDescription="Crie o primeiro projeto para começar a organizar as entregas."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas</CardTitle>
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
                  tasks={clientTasks}
                  clients={taskClients}
                  projects={taskProjects}
                  profiles={taskProfiles}
                  hideClientColumn
                  onEdit={(task) => {
                    setEditingTask(task);
                    setTaskDrawerOpen(true);
                  }}
                  onDelete={(task) => setDeletingTask(task)}
                  emptyTitle="Você ainda não possui tarefas neste cliente."
                  emptyDescription="Crie a primeira tarefa para começar a acompanhar a operação."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conteudos" className="pt-4">
          <MockModuleNotice module="Conteúdos" />
          <Card>
            <CardHeader>
              <CardTitle>Conteúdos</CardTitle>
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
              <ContentTable
                contents={clientContents}
                hideClientColumn
                onEdit={(content) => {
                  setEditingContent(content);
                  setContentDrawerOpen(true);
                }}
                onDelete={(content) => setDeletingContent(content)}
                emptyTitle="Você ainda não possui conteúdos neste cliente."
                emptyDescription="Crie o primeiro conteúdo para começar a planejar a produção."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {PLACEHOLDER_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-4">
            <EmptyState title="Em construção" description={tab.description} />
          </TabsContent>
        ))}
      </Tabs>

      <ClientFormDrawer
        key={client.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        profiles={profiles}
        services={services}
        onSaved={refetch}
      />

      <ProjectFormDrawer
        open={projectDrawerOpen}
        onOpenChange={setProjectDrawerOpen}
        project={editingProject}
        clients={projectClients}
        profiles={projectProfiles}
        defaultClientId={client.id}
        onSaved={refetchProjects}
      />

      <TaskFormDrawer
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
        task={editingTask}
        clients={taskClients}
        projects={taskProjects}
        profiles={taskProfiles}
        defaultClientId={client.id}
        onSaved={refetchTasks}
      />

      <ContentFormDrawer
        open={contentDrawerOpen}
        onOpenChange={setContentDrawerOpen}
        content={editingContent}
        defaultClientId={client.id}
      />

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

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${deletingProject?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingProject) return;
          try {
            await removeProject(deletingProject.id);
            toast.success("Projeto excluído.");
            refetchProjects();
          } catch {
            toast.error("Não foi possível excluir o projeto. Tente novamente.");
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
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${client.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          try {
            await removeClient(client.id);
            toast.success("Cliente excluído.");
            router.push("/clients");
          } catch {
            toast.error("Não foi possível excluir o cliente. Tente novamente.");
          }
        }}
      />
    </div>
  );
}
