"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export type DeliverableBillingPeriod = "unico" | "semanal" | "mensal" | "trimestral" | "anual";
export type DeliverableStatus = "ativo" | "pausado" | "encerrado";

export interface Deliverable {
  id: string;
  clientId: string;
  contractId: string | null;
  serviceId: string | null;
  name: string;
  quantity: number;
  billingPeriod: DeliverableBillingPeriod;
  startDate: string | null;
  endDate: string | null;
  status: DeliverableStatus;
  deliveredCount: number;
  notes: string | null;
}

export interface DeliverableInput {
  contractId?: string | null;
  serviceId?: string | null;
  name: string;
  quantity: number;
  billingPeriod: DeliverableBillingPeriod;
  startDate?: string | null;
  endDate?: string | null;
  status: DeliverableStatus;
  deliveredCount: number;
  notes?: string | null;
}

function mapDeliverable(row: Tables<"deliverables">): Deliverable {
  return {
    id: row.id,
    clientId: row.client_id,
    contractId: row.contract_id,
    serviceId: row.service_id,
    name: row.name,
    quantity: row.quantity,
    billingPeriod: row.billing_period as DeliverableBillingPeriod,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as DeliverableStatus,
    deliveredCount: row.delivered_count,
    notes: row.notes,
  };
}

async function loadDeliverables(clientId: string): Promise<Deliverable[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDeliverable);
}

export function useDeliverables(clientId: string) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDeliverables(await loadDeliverables(clientId));
    } catch {
      setError("Não foi possível carregar os entregáveis.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let active = true;
    loadDeliverables(clientId)
      .then((data) => {
        if (active) setDeliverables(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os entregáveis.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return { deliverables, loading, error, refetch };
}

export async function createDeliverable(clientId: string, input: DeliverableInput): Promise<Deliverable> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      contract_id: input.contractId || null,
      service_id: input.serviceId || null,
      name: input.name,
      quantity: input.quantity,
      billing_period: input.billingPeriod,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      status: input.status,
      delivered_count: input.deliveredCount,
      notes: input.notes || null,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar entregável.");
  return mapDeliverable(data);
}

export async function updateDeliverable(id: string, input: DeliverableInput): Promise<Deliverable> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("deliverables")
    .update({
      contract_id: input.contractId || null,
      service_id: input.serviceId || null,
      name: input.name,
      quantity: input.quantity,
      billing_period: input.billingPeriod,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      status: input.status,
      delivered_count: input.deliveredCount,
      notes: input.notes || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao atualizar entregável.");
  return mapDeliverable(data);
}

export async function removeDeliverable(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", id);
  if (error) throw error;
}
