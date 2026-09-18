"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileWarning, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useTicket, removeTicket, useTicketComments, addTicketComment } from "@/lib/data/tickets";
import { ticketPriorityConfig, ticketStatusConfig } from "@/lib/data/tickets";
import { useHasPermission } from "@/lib/auth/current-actor-context";
import { RequirePermission } from "@/components/shared/require-permission";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EntityLink } from "@/components/shared/entity-link";
import { TicketFormDrawer } from "@/components/tickets/ticket-form-drawer";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RequirePermission permission="tickets.view">
      <TicketDetailContent params={params} />
    </RequirePermission>
  );
}

function TicketDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const canManage = useHasPermission("tickets.manage");
  const { ticket, clients, projects, profiles, loading, error, refetch } = useTicket(id);
  const { comments, loading: commentsLoading, refetch: refetchComments } = useTicketComments(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendComment(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await addTicketComment(id, message);
      setMessage("");
      refetchComments();
    } catch {
      toast.error("Não foi possível enviar o comentário.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <ErrorState description={error} onRetry={refetch} />;
  if (!ticket) return <EmptyState icon={FileWarning} title="Ticket não encontrado" description="Ele pode ter sido excluído." />;

  const client = clients.find((c) => c.id === ticket.clientId);
  const project = projects.find((p) => p.id === ticket.projectId);
  const assignee = profiles.find((p) => p.id === ticket.assigneeId);
  const requester = profiles.find((p) => p.id === ticket.requesterId);
  const priority = ticketPriorityConfig[ticket.priority];
  const status = ticketStatusConfig[ticket.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-semibold text-foreground">{ticket.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className={cn("size-2 shrink-0 rounded-full", priority.dotClass)} aria-hidden />
              {priority.label}
            </span>
          </div>
        </div>
        {canManage && (
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
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
          {ticket.description && (
            <div className="sm:col-span-2">
              <p className="text-[12px] text-muted-foreground">Descrição</p>
              <p className="text-[13px] text-foreground">{ticket.description}</p>
            </div>
          )}
          <div>
            <p className="text-[12px] text-muted-foreground">Solicitante</p>
            <p className="text-[13px] text-foreground">{requester?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Responsável</p>
            <p className="text-[13px] text-foreground">{assignee?.name ?? "Sem responsável"}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Cliente</p>
            <p className="text-[13px] text-foreground">
              {client ? <EntityLink href={`/clients/${client.id}`}>{client.name}</EntityLink> : "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Projeto</p>
            <p className="text-[13px] text-foreground">
              {project ? <EntityLink href={`/projects/${project.id}`}>{project.name}</EntityLink> : "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Categoria</p>
            <p className="text-[13px] text-foreground">{ticket.category ?? "—"}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Prazo</p>
            <p className="text-[13px] text-foreground">{ticket.dueDate ? formatDateShort(ticket.dueDate) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comunicação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {commentsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : comments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nenhuma mensagem ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((comment) => {
                const author = profiles.find((p) => p.id === comment.authorId);
                return (
                  <div key={comment.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground">{author?.name ?? "Alguém"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-foreground">{comment.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSendComment} className="flex flex-col gap-2">
            <Textarea placeholder="Escreva uma mensagem..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !message.trim()}>
                <Send className="size-3.5" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TicketFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        ticket={ticket}
        clients={clients}
        projects={projects}
        profiles={profiles}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir ticket"
        description={`Tem certeza que deseja excluir "${ticket.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          try {
            await removeTicket(ticket.id);
            toast.success("Ticket excluído.");
            router.push("/tickets");
          } catch {
            toast.error("Não foi possível excluir o ticket.");
          }
        }}
      />
    </div>
  );
}
