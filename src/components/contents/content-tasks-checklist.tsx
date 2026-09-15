import Link from "next/link";
import { CheckSquare, ListChecks, Square } from "lucide-react";

import type { Task } from "@/lib/types";
import { getTeamMember } from "@/lib/mock-data/users";
import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskWorkflowConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function ContentTasksChecklist({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nenhuma tarefa relacionada"
        description="As tarefas de produção deste conteúdo aparecerão aqui."
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {tasks.map((task) => {
        const done = task.status === "concluido";
        const assignee = getTeamMember(task.assigneeId);
        const status = taskWorkflowConfig[task.status];
        const overdue = !done && isOverdue(task.dueDate);
        const Icon = done ? CheckSquare : Square;

        return (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon
                className={cn("size-4 shrink-0", done ? "text-primary" : "text-muted-foreground")}
                aria-hidden
              />
              <div className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    "truncate text-[13px] font-medium",
                    done ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {task.title}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {assignee?.name ?? "—"} ·{" "}
                  <span className={overdue ? "font-medium text-status-danger-fg" : undefined}>
                    {getTaskDueLabel(task.dueDate, done)}
                  </span>
                </span>
              </div>
            </div>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
