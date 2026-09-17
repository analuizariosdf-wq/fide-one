"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning, Paperclip, Pencil, Trash2 } from "lucide-react";

import { formatDateShort } from "@/lib/format";
import { contentEditorialConfig } from "@/lib/status";
import { useContent, useContentRelatedTasks, removeContent } from "@/lib/data/contents";
import { useTasks } from "@/lib/data/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntityLink } from "@/components/shared/entity-link";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";
import { ContentTasksChecklist } from "@/components/contents/content-tasks-checklist";

export default function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { content, clients, projects, profiles, loading, error, refetch } = useContent(id);
  const { tasks } = useTasks();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const client = useMemo(
    () => (content ? clients.find((c) => c.id === content.clientId) : undefined),
    [clients, content],
  );
  const project = useMemo(
    () => (content?.projectId ? projects.find((p) => p.id === content.projectId) : undefined),
    [projects, content],
  );
  const responsible = useMemo(
    () => (content ? profiles.find((p) => p.id === content.responsibleId) : undefined),
    [profiles, content],
  );

  const {
    tasks: relatedTasks,
    loading: relatedTasksLoading,
    error: relatedTasksError,
    refetch: refetchRelatedTasks,
  } = useContentRelatedTasks(content?.taskIds ?? []);

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

  if (!content) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Conteúdo não encontrado"
        description="Ele pode ter sido excluído."
      />
    );
  }

  const status = contentEditorialConfig[content.status];

  async function handleConfirmDelete() {
    if (!content) return;
    try {
      await removeContent(content.id);
      toast.success("Conteúdo excluído.");
      router.push("/contents");
    } catch {
      toast.error("Não foi possível excluir o conteúdo. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {client && (
            <EntityLink href={`/clients/${client.id}`} muted className="text-[13px]">
              {client.name}
            </EntityLink>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1>{content.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            {content.contentType} · {content.channel} ·{" "}
            {formatDateShort(content.publishDate)}
            {content.publishTime ? ` · ${content.publishTime}` : ""}
          </p>
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
        <MetaField label="Cliente" value={client?.name ?? "—"} href={client ? `/clients/${client.id}` : undefined} />
        <MetaField
          label="Projeto"
          value={project?.name ?? "Sem projeto"}
          href={project ? `/projects/${project.id}` : undefined}
        />
        <MetaField label="Responsável" value={responsible?.name ?? "Sem responsável"} />
        <MetaField
          label="Data"
          value={
            formatDateShort(content.publishDate) +
            (content.publishTime ? ` · ${content.publishTime}` : "")
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Legenda</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-muted-foreground">
                {content.caption || "Nenhuma legenda adicionada."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{content.cta || "Nenhum CTA definido."}</p>
            </CardContent>
          </Card>

          {content.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{content.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Mídia</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Paperclip}
                title="Nenhum arquivo anexado"
                description="Os arquivos serão implementados posteriormente com Supabase Storage."
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Tarefas relacionadas</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedTasksError ? (
              <ErrorState description={relatedTasksError} onRetry={refetchRelatedTasks} />
            ) : relatedTasksLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <ContentTasksChecklist tasks={relatedTasks} profiles={profiles} />
            )}
          </CardContent>
        </Card>
      </div>

      <ContentFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        content={content}
        clients={clients}
        projects={projects}
        profiles={profiles}
        tasks={tasks}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir conteúdo"
        description={`Tem certeza que deseja excluir "${content.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function MetaField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      {href ? (
        <EntityLink href={href} className="text-[13px]">
          {value}
        </EntityLink>
      ) : (
        <span className="text-[13px] font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}
