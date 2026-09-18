"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export type ServiceExtraStatus = "registrado" | "cobrado" | "cortesia";

export interface ServiceExtra {
  id: string;
  clientId: string;
  serviceId: string | null;
  taskId: string | null;
  contentId: string | null;
  description: string;
  occurredOn: string;
  status: ServiceExtraStatus;
}

export interface ServiceExtraInput {
  serviceId?: string | null;
  taskId?: string | null;
  contentId?: string | null;
  description: string;
  occurredOn: string;
  status: ServiceExtraStatus;
}

function mapServiceExtra(row: Tables<"service_extras">): ServiceExtra {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    taskId: row.task_id,
    contentId: row.content_id,
    description: row.description,
    occurredOn: row.occurred_on,
    status: row.status,
  };
}

async function loadServiceExtras(clientId: string): Promise<ServiceExtra[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("service_extras")
    .select("*")
    .eq("client_id", clientId)
    .order("occurred_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapServiceExtra);
}

export function useServiceExtras(clientId: string) {
  const [extras, setExtras] = useState<ServiceExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setExtras(await loadServiceExtras(clientId));
    } catch {
      setError("Não foi possível carregar os serviços extras.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let active = true;
    loadServiceExtras(clientId)
      .then((data) => {
        if (active) setExtras(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os serviços extras.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return { extras, loading, error, refetch };
}

export async function createServiceExtra(clientId: string, input: ServiceExtraInput): Promise<ServiceExtra> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("service_extras")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      service_id: input.serviceId || null,
      task_id: input.taskId || null,
      content_id: input.contentId || null,
      description: input.description,
      occurred_on: input.occurredOn,
      status: input.status,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao registrar serviço extra.");
  return mapServiceExtra(data);
}

export async function removeServiceExtra(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("service_extras").delete().eq("id", id);
  if (error) throw error;
}
