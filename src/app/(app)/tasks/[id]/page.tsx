"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Paperclip, Pencil, Trash2 } from "lucide-react";

import { getTaskDueLabel, isOverdue } from "@/lib/format";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
import { useTask, useTaskComments, addTaskComment, removeTask } from "@/lib/data/tasks";
import { useTaskRelatedContents } from "@/lib/data/contents";
import { contentEditorialConfig } from "@/lib/status";
import { cn, toInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { task, clients, projects, profiles, loading, error, refetch } = useTask(id);
  const { comments, loading: commentsLoading, error: commentsError, refetch: refetchComments } =
    useTaskComments(id);
  const {
    contents: relatedContents,
    loading: relatedContentsLoading,
    error: relatedContentsError,
    refetch: refetchRelatedContents,
  } = useTaskRelatedContents(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const client = useMemo(
    () => (task?.clientId ? clients.find((c) => c.id === task.clientId) : undefined),
    [clients, task],
  );
  const project = useMemo(
    () => (task?.projectId ? projects.find((p) => p.id === task.projectId) : undefined),
    [projects, task],
  );
  const assignee = useMemo(
    () => (task ? profiles.find((p) => p.id === task.assigneeId) : undefined),
    [profiles, task],
  );
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  if (!task) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Tarefa não encontrada"
        description="Ela pode ter sido excluída."
      />
    );
  }

  const status = taskWorkflowConfig[task.status];
  const priority = taskUrgencyConfig[task.priority];
  const overdue = task.status !== "concluido" && isOverdue(task.dueDate);

  async function handleSendComment() {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      await addTaskComment(id, comment.trim());
      setComment("");
      refetchComments();
    } catch {
      toast.error("Não foi possível enviar o comentário. Tente novamente.");
    } finally {
      setSendingComment(false);
    }
  }

  async function handleConfirmDelete() {
    if (!task) return;
    try {
      await removeTask(task.id);
      toast.success("Tarefa excluída.");
      router.push("/tasks");
    } catch {
      toast.error("Não foi possível excluir a tarefa. Tente novamente.");
    }
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
        <MetaField label="Responsável" value={assignee?.name ?? "Sem responsável"} />
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
              {relatedContentsError ? (
                <ErrorState description={relatedContentsError} onRetry={refetchRelatedContents} />
              ) : relatedContentsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : relatedContents.length === 0 ? (
                <p className="text-muted-foreground">Nenhum conteúdo relacionado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {relatedContents.map((relatedContent) => (
                    <Link
                      key={relatedContent.id}
                      href={`/contents/${relatedContent.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted"
                    >
                      <span className="text-[13px] font-medium text-foreground">
                        {relatedContent.title}
                      </span>
                      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        {relatedContent.contentType} · {relatedContent.channel}
                        <Badge variant={contentEditorialConfig[relatedContent.status].variant}>
                          {contentEditorialConfig[relatedContent.status].label}
                        </Badge>
                      </span>
                    </Link>
                  ))}
                </div>
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
              {commentsError ? (
                <ErrorState description={commentsError} onRetry={refetchComments} />
              ) : commentsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground">Nenhum comentário ainda.</p>
              ) : (
                comments.map((item) => {
                  const author = profileById.get(item.authorId);
                  return (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[11px]">
                          {author ? toInitials(author.name) : "—"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-[13px] text-foreground">
                          <span className="font-medium">{author?.name ?? "Usuário removido"}</span>{" "}
                          {item.message}
                        </p>
                        <span className="text-[12px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </span>
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
                  disabled={sendingComment}
                />
                <Button variant="outline" onClick={handleSendComment} disabled={sendingComment}>
                  {sendingComment ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Ainda não disponível"
              description="O histórico de atividade (activity_logs) será implementado em uma etapa futura."
            />
          </CardContent>
        </Card>
      </div>

      <TaskFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        clients={clients}
        projects={projects}
        profiles={profiles}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${task.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
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
