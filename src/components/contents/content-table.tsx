"use client";

import { useRouter } from "next/navigation";
import { Images, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Content } from "@/lib/types";
import { getClient } from "@/lib/mock-data/clients";
import { getProject } from "@/lib/mock-data/projects";
import { getTeamMember } from "@/lib/mock-data/users";
import { formatDateShort } from "@/lib/format";
import { contentEditorialConfig } from "@/lib/status";
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

interface ContentTableProps {
  contents: Content[];
  hideClientColumn?: boolean;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ContentTable({
  contents,
  hideClientColumn,
  onEdit,
  onDelete,
  emptyTitle = "Nenhum conteúdo encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo conteúdo.",
}: ContentTableProps) {
  const router = useRouter();

  if (contents.length === 0) {
    return <EmptyState icon={Images} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Conteúdo</TableHead>
          {!hideClientColumn && <TableHead>Cliente</TableHead>}
          <TableHead>Projeto</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Formato</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contents.map((content) => {
          const client = getClient(content.clientId);
          const project = getProject(content.projectId);
          const responsible = getTeamMember(content.responsibleId);
          const status = contentEditorialConfig[content.status];

          return (
            <TableRow
              key={content.id}
              className="cursor-pointer"
              onClick={() => router.push(`/contents/${content.id}`)}
            >
              <TableCell className="font-medium text-foreground">{content.title}</TableCell>
              {!hideClientColumn && (
                <TableCell>
                  {client ? (
                    <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              <TableCell>
                {project ? (
                  <EntityLink href={`/projects/${project.id}`} muted>
                    {project.name}
                  </EntityLink>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{content.channel}</TableCell>
              <TableCell className="text-muted-foreground">{content.contentType}</TableCell>
              <TableCell className="text-muted-foreground">{responsible?.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateShort(content.publishDate)}
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
                      aria-label="Ações do conteúdo"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(content)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(content)}>
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
