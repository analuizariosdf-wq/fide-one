"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export type ContractBillingPeriod = "unico" | "mensal" | "trimestral" | "semestral" | "anual";
export type ContractStatus = "ativo" | "suspenso" | "encerrado";

export interface Contract {
  id: string;
  clientId: string;
  serviceId: string | null;
  startDate: string;
  endDate: string | null;
  monthlyValue: number | null;
  billingPeriod: ContractBillingPeriod;
  status: ContractStatus;
  autoRenew: boolean;
  notes: string | null;
}

export interface ContractInput {
  clientId: string;
  serviceId: string | null;
  startDate: string;
  endDate?: string | null;
  monthlyValue?: number | null;
  billingPeriod: ContractBillingPeriod;
  status: ContractStatus;
  autoRenew: boolean;
  notes?: string | null;
}

function mapContract(row: Tables<"contracts">): Contract {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    startDate: row.start_date,
    endDate: row.end_date,
    monthlyValue: row.monthly_value !== null ? Number(row.monthly_value) : null,
    billingPeriod: row.billing_period,
    status: row.status,
    autoRenew: row.auto_renew,
    notes: row.notes,
  };
}

async function loadContracts(clientId?: string): Promise<Contract[]> {
  const supabase = createSupabaseClient();
  let query = supabase.from("contracts").select("*").order("start_date", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapContract);
}

export function useContracts(clientId?: string) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContracts(await loadContracts(clientId));
    } catch {
      setError("Não foi possível carregar os contratos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let active = true;
    loadContracts(clientId)
      .then((data) => {
        if (active) setContracts(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os contratos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return { contracts, loading, error, refetch };
}

async function assertClientBelongsToOrg(clientId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente inválido para esta organização.");
}

function toRowPayload(input: ContractInput, organizationId: string) {
  return {
    organization_id: organizationId,
    client_id: input.clientId,
    service_id: input.serviceId,
    start_date: input.startDate,
    end_date: input.endDate || null,
    monthly_value: input.monthlyValue ?? null,
    billing_period: input.billingPeriod,
    status: input.status,
    auto_renew: input.autoRenew,
    notes: input.notes || null,
  };
}

export async function createContract(input: ContractInput): Promise<Contract> {
  await assertClientBelongsToOrg(input.clientId);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("contracts")
    .insert(toRowPayload(input, organizationId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar contrato.");
  return mapContract(data);
}

export async function updateContract(id: string, input: ContractInput): Promise<Contract> {
  await assertClientBelongsToOrg(input.clientId);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("contracts")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar contrato.");
  return mapContract(data);
}

export async function removeContract(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}
