"use client";

import { toast } from "sonner";

import type { Task, TaskWorkflowStatus } from "@/lib/types";
import { groupTasksByStatus, updateTask } from "@/lib/services/tasks-service";
import { taskWorkflowConfig, taskWorkflowOrder } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { ListChecks } from "lucide-react";

interface TaskKanbanViewProps {
  tasks: Task[];
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  const groups = groupTasksByStatus(tasks);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nenhuma tarefa encontrada"
        description="Ajuste os filtros ou crie uma nova tarefa."
      />
    );
  }

  function handleMove(task: Task, status: TaskWorkflowStatus) {
    updateTask(task.id, { status });
    toast.success(`Tarefa movida para "${taskWorkflowConfig[status].label}".`);
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
