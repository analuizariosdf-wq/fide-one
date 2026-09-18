"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export type TicketPriority = "baixa" | "normal" | "alta" | "urgente";
export type TicketStatus = "aberto" | "em_andamento" | "aguardando" | "resolvido" | "fechado";

type BadgeVariant = "info" | "success" | "warning" | "neutral" | "danger";

export const ticketStatusConfig: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  aberto: { label: "Aberto", variant: "info" },
  em_andamento: { label: "Em andamento", variant: "warning" },
  aguardando: { label: "Aguardando", variant: "neutral" },
  resolvido: { label: "Resolvido", variant: "success" },
  fechado: { label: "Fechado", variant: "neutral" },
};

export const ticketPriorityConfig: Record<TicketPriority, { label: string; dotClass: string }> = {
  baixa: { label: "Baixa", dotClass: "bg-status-neutral-dot" },
  normal: { label: "Normal", dotClass: "bg-status-info-dot" },
  alta: { label: "Alta", dotClass: "bg-status-warning-dot" },
  urgente: { label: "Urgente", dotClass: "bg-status-danger-dot" },
};

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  requesterId: string | null;
  assigneeId: string | null;
  clientId: string | null;
  projectId: string | null;
  category: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  dueDate: string | null;
  createdAt: string;
}

export interface TicketInput {
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  category?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  dueDate?: string | null;
}

export interface ClientOption {
  id: string;
  name: string;
}
export interface ProjectOption {
  id: string;
  name: string;
}
export interface ProfileOption {
  id: string;
  name: string;
}

function mapTicket(row: Tables<"tickets">): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requesterId: row.requester_id,
    assigneeId: row.assignee_id,
    clientId: row.client_id,
    projectId: row.project_id,
    category: row.category,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

interface LoadedData {
  tickets: Ticket[];
  clients: ClientOption[];
  projects: ProjectOption[];
  profiles: ProfileOption[];
}

async function loadTicketsData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();
  const [ticketsRes, clientsRes, projectsRes, profilesRes] = await Promise.all([
    supabase.from("tickets").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("profiles").select("id, name").order("name"),
  ]);

  if (ticketsRes.error) throw ticketsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (profilesRes.error) throw profilesRes.error;

  return {
    tickets: (ticketsRes.data ?? []).map(mapTicket),
    clients: clientsRes.data ?? [],
    projects: projectsRes.data ?? [],
    profiles: profilesRes.data ?? [],
  };
}

export function useTickets() {
  const [data, setData] = useState<LoadedData>({ tickets: [], clients: [], projects: [], profiles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadTicketsData());
    } catch {
      setError("Não foi possível carregar os tickets. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadTicketsData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os tickets. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { ...data, loading, error, refetch };
}

export function useTicket(id: string) {
  const { tickets, clients, projects, profiles, loading, error, refetch } = useTickets();
  return { ticket: tickets.find((t) => t.id === id), clients, projects, profiles, loading, error, refetch };
}

function toRowPayload(input: TicketInput, organizationId: string, requesterId?: string) {
  return {
    organization_id: organizationId,
    title: input.title,
    description: input.description || null,
    assignee_id: input.assigneeId || null,
    client_id: input.clientId || null,
    project_id: input.projectId || null,
    category: input.category || null,
    priority: input.priority,
    status: input.status,
    due_date: input.dueDate || null,
    ...(requesterId ? { requester_id: requesterId } : {}),
  };
}

export async function createTicket(input: TicketInput): Promise<Ticket> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tickets")
    .insert(toRowPayload(input, organizationId, user?.id))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar ticket.");
  return mapTicket(data);
}

export async function updateTicket(id: string, input: TicketInput): Promise<Ticket> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("tickets")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar ticket.");
  return mapTicket(data);
}

export async function removeTicket(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) throw error;
}

export interface TicketComment {
  id: string;
  authorId: string | null;
  message: string;
  createdAt: string;
}

async function loadTicketComments(ticketId: string): Promise<TicketComment[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("ticket_comments")
    .select("id, author_id, message, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, authorId: row.author_id, message: row.message, createdAt: row.created_at }));
}

export function useTicketComments(ticketId: string) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setComments(await loadTicketComments(ticketId));
    } catch {
      setError("Não foi possível carregar os comentários.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    let active = true;
    loadTicketComments(ticketId)
      .then((data) => {
        if (active) setComments(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os comentários.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ticketId]);

  return { comments, loading, error, refetch };
}

export async function addTicketComment(ticketId: string, message: string): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) return;

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("ticket_comments").insert({
    organization_id: organizationId,
    ticket_id: ticketId,
    author_id: user.id,
    message: trimmed,
  });
  if (error) throw error;
}
