"use client";

import { useRouter } from "next/navigation";
import { ListChecks, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Task } from "@/lib/types";
import { getClient } from "@/lib/mock-data/clients";
import { getProject } from "@/lib/mock-data/projects";
import { getTeamMember } from "@/lib/mock-data/users";
import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/shared/entity-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskListViewProps {
  tasks: Task[];
  hideClientColumn?: boolean;
  hideProjectColumn?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskListView({
  tasks,
  hideClientColumn,
  hideProjectColumn,
  onEdit,
  onDelete,
  emptyTitle = "Nenhuma tarefa encontrada",
  emptyDescription = "Ajuste os filtros ou crie uma nova tarefa.",
}: TaskListViewProps) {
  const router = useRouter();

  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarefa</TableHead>
          {!hideClientColumn && <TableHead>Cliente</TableHead>}
          {!hideProjectColumn && <TableHead>Projeto</TableHead>}
          <TableHead>Responsável</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const client = getClient(task.clientId);
          const project = getProject(task.projectId);
          const assignee = getTeamMember(task.assigneeId);
          const status = taskWorkflowConfig[task.status];
          const priority = taskUrgencyConfig[task.priority];
          const overdue = task.status !== "concluido" && isOverdue(task.dueDate);

          return (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <TableCell className="font-medium text-foreground">{task.title}</TableCell>
              {!hideClientColumn && (
                <TableCell>
                  {client ? (
                    <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
                  ) : (
                    <span className="text-muted-foreground">Interno</span>
                  )}
                </TableCell>
              )}
              {!hideProjectColumn && (
                <TableCell>
                  {project ? (
                    <EntityLink href={`/projects/${project.id}`} muted>
                      {project.name}
                    </EntityLink>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{assignee?.name ?? "—"}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("size-2 rounded-full", priority.dotClass)} aria-hidden />
                  {priority.label}
                </span>
              </TableCell>
              <TableCell className={cn(overdue ? "font-medium text-status-danger-fg" : "text-muted-foreground")}>
                {getTaskDueLabel(task.dueDate, task.status === "concluido")}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ações da tarefa"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                      <Trash2 className="size-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
