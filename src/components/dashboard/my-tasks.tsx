import { ListChecks } from "lucide-react";

import type { Client, TaskItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { taskPriorityConfig, taskStatusConfig } from "@/lib/status";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

interface MyTasksProps {
  tasks: TaskItem[];
  getClient: (id: string | null) => Client | undefined;
}

export function MyTasks({ tasks, getClient }: MyTasksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas tarefas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nenhuma tarefa pendente" />
        ) : (
          tasks.map((task) => {
            const client = getClient(task.clientId);
            const priority = taskPriorityConfig[task.priority];
            const status = taskStatusConfig[task.status];

            return (
              <div
                key={task.id}
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
                    <span className="text-[12px] text-muted-foreground">
                      {client?.name ?? "Interno"} · {task.dueLabel}
                    </span>
                  </div>
                </div>
                <Badge variant={status.variant} className="shrink-0">
                  {status.label}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
