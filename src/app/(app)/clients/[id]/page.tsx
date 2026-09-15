"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Pencil, Plus, Trash2 } from "lucide-react";

import type { Project, Task } from "@/lib/types";
import { useClient, removeClient } from "@/lib/services/clients-service";
import { useProjects, removeProject } from "@/lib/services/projects-service";
import { useTasks, removeTask } from "@/lib/services/tasks-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientHeader } from "@/components/clients/client-header";
import { ClientKpis } from "@/components/clients/client-kpis";
import { ClientFormDrawer } from "@/components/clients/client-form-drawer";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";

const PLACEHOLDER_TABS = [
  { value: "conteudos", label: "Conteúdos", description: "Conteúdos deste cliente aparecerão aqui em uma próxima etapa." },
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
  const client = useClient(id);
  const clientProjects = useProjects({ clientId: id });
  const clientTasks = useTasks({ clientId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

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
          {PLACEHOLDER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao-geral" className="pt-4">
          <ClientKpis clientId={client.id} monthlyFee={client.monthlyFee} />

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
              <ProjectTable
                projects={clientProjects}
                hideClientColumn
                onEdit={(project) => {
                  setEditingProject(project);
                  setProjectDrawerOpen(true);
                }}
                onDelete={(project) => setDeletingProject(project)}
                emptyTitle="Você ainda não possui projetos neste cliente."
                emptyDescription="Crie o primeiro projeto para começar a organizar as entregas."
              />
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
              <TaskListView
                tasks={clientTasks}
                hideClientColumn
                onEdit={(task) => {
                  setEditingTask(task);
                  setTaskDrawerOpen(true);
                }}
                onDelete={(task) => setDeletingTask(task)}
                emptyTitle="Você ainda não possui tarefas neste cliente."
                emptyDescription="Crie a primeira tarefa para começar a acompanhar a operação."
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

      <ClientFormDrawer open={editOpen} onOpenChange={setEditOpen} client={client} />

      <ProjectFormDrawer
        open={projectDrawerOpen}
        onOpenChange={setProjectDrawerOpen}
        project={editingProject}
        defaultClientId={client.id}
      />

      <TaskFormDrawer
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
        task={editingTask}
        defaultClientId={client.id}
      />

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

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deletingTask) return;
          removeTask(deletingTask.id);
          toast.success("Tarefa excluída.");
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${client.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          removeClient(client.id);
          toast.success("Cliente excluído.");
          router.push("/clients");
        }}
      />
    </div>
  );
}
