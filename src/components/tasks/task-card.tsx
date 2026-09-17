"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import type { Task, TaskWorkflowStatus } from "@/lib/types";
import type { ClientOption, ProfileOption, ProjectOption } from "@/lib/data/tasks";
import { toInitials } from "@/lib/utils";
import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskUrgencyConfig, taskWorkflowConfig, taskWorkflowOrder } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityLink } from "@/components/shared/entity-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  client?: ClientOption;
  project?: ProjectOption;
  assignee?: ProfileOption;
  onMove: (status: TaskWorkflowStatus) => void;
}

export function TaskCard({ task, client, project, assignee, onMove }: TaskCardProps) {
  const router = useRouter();
  const priority = taskUrgencyConfig[task.priority];
  const overdue = task.status !== "concluido" && isOverdue(task.dueDate);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/tasks/${task.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(`/tasks/${task.id}`);
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className={cn("size-2 rounded-full", priority.dotClass)} aria-hidden />
          {priority.label}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Mover tarefa"
              onClick={(event) => event.stopPropagation()}
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {taskWorkflowOrder.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onMove(status)}
                disabled={status === task.status}
              >
                {taskWorkflowConfig[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-[13px] font-medium leading-snug text-foreground">{task.title}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
        {client && <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>}
        {project && (
          <EntityLink href={`/projects/${project.id}`} muted>
            {project.name}
          </EntityLink>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className={cn("text-[12px]", overdue ? "font-medium text-status-danger-fg" : "text-muted-foreground")}>
          {getTaskDueLabel(task.dueDate, task.status === "concluido")}
        </span>
        {assignee && (
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px]">{toInitials(assignee.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
