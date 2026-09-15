"use client";

import { useRouter } from "next/navigation";
import { FolderKanban, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Project } from "@/lib/types";
import { getClient } from "@/lib/mock-data/clients";
import { getTeamMember } from "@/lib/mock-data/users";
import { formatDateShort } from "@/lib/format";
import { projectStatusConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface ProjectTableProps {
  projects: Project[];
  hideClientColumn?: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProjectTable({
  projects,
  hideClientColumn,
  onEdit,
  onDelete,
  emptyTitle = "Nenhum projeto encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo projeto.",
}: ProjectTableProps) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <EmptyState icon={FolderKanban} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projeto</TableHead>
          {!hideClientColumn && <TableHead>Cliente</TableHead>}
          <TableHead>Responsável</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Período</TableHead>
          <TableHead>Progresso</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const client = getClient(project.clientId);
          const responsible = getTeamMember(project.responsibleId);
          const status = projectStatusConfig[project.status];

          return (
            <TableRow
              key={project.id}
              className="cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <TableCell className="font-medium text-foreground">{project.name}</TableCell>
              {!hideClientColumn && (
                <TableCell>
                  {client ? (
                    <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{responsible?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateShort(project.startDate)} — {formatDateShort(project.endDate)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="w-20" />
                  <span className="text-[12px] text-muted-foreground">{project.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ações do projeto"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
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
