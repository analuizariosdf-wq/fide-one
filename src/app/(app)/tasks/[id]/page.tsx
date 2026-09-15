"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Paperclip, Pencil, Trash2 } from "lucide-react";

import { getClient } from "@/lib/mock-data/clients";
import { getProject } from "@/lib/mock-data/projects";
import { getTeamMember } from "@/lib/mock-data/users";
import { contents } from "@/lib/mock-data/contents";
import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
import { useTask, updateTask, removeTask } from "@/lib/services/tasks-service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntityLink } from "@/components/shared/entity-link";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const task = useTask(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comment, setComment] = useState("");

  if (!task) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Tarefa não encontrada"
        description="Ela pode ter sido excluída."
      />
    );
  }

  const client = getClient(task.clientId);
  const project = getProject(task.projectId);
  const assignee = getTeamMember(task.assigneeId);
  const relatedContent = contents.find((content) => content.id === task.relatedContentId);
  const status = taskWorkflowConfig[task.status];
  const priority = taskUrgencyConfig[task.priority];
  const overdue = task.status !== "concluido" && isOverdue(task.dueDate);

  function handleSendComment() {
    if (!comment.trim() || !task) return;

    updateTask(task.id, {
      comments: [
        ...(task.comments ?? []),
        { id: crypto.randomUUID(), authorId: "daniel", message: comment.trim(), timeLabel: "agora" },
      ],
    });
    setComment("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1>{task.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {client && (
            <p className="text-muted-foreground">
              <EntityLink href={`/clients/${client.id}`} className="text-muted-foreground hover:text-primary">
                {client.name}
              </EntityLink>
            </p>
          )}
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
        <MetaField
          label="Prioridade"
          value={priority.label}
          dotClass={priority.dotClass}
        />
        <MetaField
          label="Prazo"
          value={getTaskDueLabel(task.dueDate, task.status === "concluido")}
          valueClassName={overdue ? "text-status-danger-fg" : undefined}
        />
        <MetaField label="Responsável" value={assignee?.name ?? "—"} />
        <MetaField
          label="Projeto"
          value={project?.name ?? "Sem projeto"}
          href={project ? `/projects/${project.id}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {task.description || "Nenhuma descrição adicionada."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo relacionado</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedContent ? (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <span className="text-[13px] font-medium text-foreground">
                    {relatedContent.title}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {relatedContent.format}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum conteúdo relacionado.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Paperclip}
                title="Nenhum arquivo anexado"
                description="Os anexos serão suportados em uma próxima etapa."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentários</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {(task.comments ?? []).length === 0 ? (
                <p className="text-muted-foreground">Nenhum comentário ainda.</p>
              ) : (
                task.comments?.map((item) => {
                  const author = getTeamMember(item.authorId);
                  return (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[11px]">{author?.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-[13px] text-foreground">
                          <span className="font-medium">{author?.name}</span> {item.message}
                        </p>
                        <span className="text-[12px] text-muted-foreground">{item.timeLabel}</span>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Escreva um comentário..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                />
                <Button variant="outline" onClick={handleSendComment}>
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(task.history ?? []).length === 0 ? (
              <p className="text-muted-foreground">Sem histórico.</p>
            ) : (
              task.history?.map((entry) => {
                const actor = getTeamMember(entry.actorId);
                return (
                  <div key={entry.id} className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
                    <p className="text-[13px] text-foreground">
                      <span className="font-medium">{actor?.name}</span> {entry.description}
                    </p>
                    <span className="text-[12px] text-muted-foreground">{entry.timeLabel}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <TaskFormDrawer open={editOpen} onOpenChange={setEditOpen} task={task} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${task.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          removeTask(task.id);
          toast.success("Tarefa excluída.");
          router.push("/tasks");
        }}
      />
    </div>
  );
}

function MetaField({
  label,
  value,
  dotClass,
  valueClassName,
  href,
}: {
  label: string;
  value: string;
  dotClass?: string;
  valueClassName?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      {href ? (
        <EntityLink href={href} className={cn("text-[13px]", valueClassName)}>
          {value}
        </EntityLink>
      ) : (
        <span className={cn("flex items-center gap-1.5 text-[13px] font-medium text-foreground", valueClassName)}>
          {dotClass && <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />}
          {value}
        </span>
      )}
    </div>
  );
}
