"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Pencil, Plus, Trash2 } from "lucide-react";

import { getClient } from "@/lib/mock-data/clients";
import { getTeamMember } from "@/lib/mock-data/users";
import { formatDateShort } from "@/lib/format";
import { projectStatusConfig } from "@/lib/status";
import { useProject, removeProject } from "@/lib/services/projects-service";
import { useTasks, removeTask } from "@/lib/services/tasks-service";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntityLink } from "@/components/shared/entity-link";
import { ProjectFormDrawer } from "@/components/projects/project-form-drawer";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const project = useProject(id);
  const projectTasks = useTasks({ projectId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  if (!project) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Projeto não encontrado"
        description="Ele pode ter sido excluído."
      />
    );
  }

  const client = getClient(project.clientId);
  const responsible = getTeamMember(project.responsibleId);
  const status = projectStatusConfig[project.status];

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
          <TaskListView
            tasks={projectTasks}
            hideProjectColumn
            onEdit={(task) => {
              setEditingTask(task);
              setTaskDrawerOpen(true);
            }}
            onDelete={(task) => setDeletingTask(task)}
            emptyTitle="Nenhuma tarefa neste projeto"
            emptyDescription="Crie a primeira tarefa para começar a acompanhar a entrega."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdos relacionados</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Em breve"
            description="O módulo de Conteúdos será conectado a este projeto em uma próxima etapa."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nenhum arquivo anexado"
            description="Os anexos serão suportados em uma próxima etapa."
          />
        </CardContent>
      </Card>

      <ProjectFormDrawer open={editOpen} onOpenChange={setEditOpen} project={project} />

      <TaskFormDrawer
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
        task={editingTask}
        defaultClientId={project.clientId}
        defaultProjectId={project.id}
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
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${project.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          removeProject(project.id);
          toast.success("Projeto excluído.");
          router.push("/projects");
        }}
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
