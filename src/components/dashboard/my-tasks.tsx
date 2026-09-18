import Link from "next/link";
import { ListChecks } from "lucide-react";

import type { Task } from "@/lib/types";
import type { ClientOption } from "@/lib/data/tasks";
import { cn } from "@/lib/utils";
import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface MyTasksProps {
  tasks: Task[];
  clients: ClientOption[];
}

export function MyTasks({ tasks, clients }: MyTasksProps) {
  const clientById = new Map(clients.map((c) => [c.id, c]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas tarefas</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tasks">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nenhuma tarefa pendente" />
        ) : (
          tasks.map((task) => {
            const client = task.clientId ? clientById.get(task.clientId) : undefined;
            const priority = taskUrgencyConfig[task.priority];
            const status = taskWorkflowConfig[task.status];
            const overdue = task.status !== "concluido" && isOverdue(task.dueDate);

            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", priority.dotClass)}
                    aria-hidden
                    title={`Prioridade ${priority.label}`}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {task.title}
                    </span>
                    <span
                      className={cn(
                        "text-[12px] text-muted-foreground",
                        overdue && "font-medium text-status-danger-fg",
                      )}
                    >
                      {client?.name ?? "Interno"} · {getTaskDueLabel(task.dueDate, task.status === "concluido")}
                    </span>
                  </div>
                </div>
                <Badge variant={status.variant} className="shrink-0">
                  {status.label}
                </Badge>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
