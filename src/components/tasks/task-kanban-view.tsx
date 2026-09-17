"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import type { Task, TaskWorkflowStatus } from "@/lib/types";
import {
  groupTasksByStatus,
  updateTaskStatus,
  type ClientOption,
  type ProfileOption,
  type ProjectOption,
} from "@/lib/data/tasks";
import { taskWorkflowConfig, taskWorkflowOrder } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { ListChecks } from "lucide-react";

interface TaskKanbanViewProps {
  tasks: Task[];
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
  onChanged: () => void;
}

export function TaskKanbanView({ tasks, clients, projects, profiles, onChanged }: TaskKanbanViewProps) {
  const groups = groupTasksByStatus(tasks);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nenhuma tarefa encontrada"
        description="Ajuste os filtros ou crie uma nova tarefa."
      />
    );
  }

  async function handleMove(task: Task, status: TaskWorkflowStatus) {
    try {
      await updateTaskStatus(task.id, status);
      toast.success(`Tarefa movida para "${taskWorkflowConfig[status].label}".`);
      onChanged();
    } catch {
      toast.error("Não foi possível mover a tarefa. Tente novamente.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {taskWorkflowOrder.map((status) => {
        const columnTasks = groups[status];

        return (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[13px] font-semibold text-foreground">
                {taskWorkflowConfig[status].label.toUpperCase()}
              </h3>
              <span className="text-[12px] text-muted-foreground">{columnTasks.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
                  Sem tarefas
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={task.clientId ? clientById.get(task.clientId) : undefined}
                    project={task.projectId ? projectById.get(task.projectId) : undefined}
                    assignee={profileById.get(task.assigneeId)}
                    onMove={(nextStatus) => handleMove(task, nextStatus)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
