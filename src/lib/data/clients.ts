"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { registerSupabaseProfile } from "@/lib/mock-data/team";
import { registerSupabaseClient } from "@/lib/mock-data/clients";
import { toInitials } from "@/lib/utils";
import type { Client } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import { clientInputSchema, type ClientInput } from "@/lib/data/client-schema";
import { getCurrentOrganizationId } from "@/lib/data/organization";

export type { ClientInput };

export interface ProfileOption {
  id: string;
  name: string;
}

export interface ServiceOption {
  id: string;
  name: string;
}

export interface ClientFilters {
  search?: string;
  status?: Client["status"] | "todos";
  responsibleId?: string | "todos";
  service?: string | "todos";
}

export function filterClients(items: Client[], filters: ClientFilters): Client[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((client) => {
    if (search && !client.name.toLowerCase().includes(search)) return false;
    if (filters.status && filters.status !== "todos" && client.status !== filters.status) {
      return false;
    }
    if (
      filters.responsibleId &&
      filters.responsibleId !== "todos" &&
      client.responsibleId !== filters.responsibleId
    ) {
      return false;
    }
    if (
      filters.service &&
      filters.service !== "todos" &&
      !client.services.includes(filters.service)
    ) {
      return false;
    }
    return true;
  });
}

function mapClient(
  row: Tables<"clients">,
  serviceNamesByClientId: Map<string, string[]>,
): Client {
  return {
    id: row.id,
    name: row.name,
    tradeName: row.trade_name ?? undefined,
    cnpj: row.cnpj ?? undefined,
    segment: row.segment ?? "",
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    responsibleId: row.responsible_id ?? "",
    services: serviceNamesByClientId.get(row.id) ?? [],
    startDate: row.start_date ?? "",
    status: row.status,
    monthlyFee: Number(row.monthly_fee),
    dueDay: row.due_day ?? 1,
    paymentMethod: row.payment_method ?? "",
    notes: row.notes ?? undefined,
  };
}

interface LoadedData {
  clients: Client[];
  profiles: ProfileOption[];
  services: ServiceOption[];
}

/**
 * Deliberately avoids PostgREST embedded selects (`clients(*, profiles(...))`)
 * — four flat queries joined in JS instead. Simpler to get right without a
 * live project to check the embed's inferred TS shape against (this
 * sandbox can't run the local Supabase stack; see the Etapa 4 summary).
 */
async function loadClientsData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();

  const [clientsRes, profilesRes, servicesRes, clientServicesRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("profiles").select("id, name"),
    supabase.from("services").select("id, name"),
    supabase.from("client_services").select("client_id, service_id"),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (servicesRes.error) throw servicesRes.error;
  if (clientServicesRes.error) throw clientServicesRes.error;

  const profiles = profilesRes.data ?? [];
  for (const profile of profiles) {
    registerSupabaseProfile({
      id: profile.id,
      name: profile.name,
      initials: toInitials(profile.name),
      role: "",
    });
  }

  const serviceNameById = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));
  const serviceNamesByClientId = new Map<string, string[]>();
  for (const link of clientServicesRes.data ?? []) {
    const name = serviceNameById.get(link.service_id);
    if (!name) continue;
    const list = serviceNamesByClientId.get(link.client_id) ?? [];
    list.push(name);
    serviceNamesByClientId.set(link.client_id, list);
  }

  const clients = (clientsRes.data ?? []).map((row) => mapClient(row, serviceNamesByClientId));
  for (const client of clients) {
    registerSupabaseClient({ id: client.id, name: client.name });
  }

  return {
    clients,
    profiles,
    services: servicesRes.data ?? [],
  };
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadClientsData();
      setClients(data.clients);
      setProfiles(data.profiles);
      setServices(data.services);
    } catch {
      setError("Não foi possível carregar os clientes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadClientsData()
      .then((data) => {
        if (!active) return;
        setClients(data.clients);
        setProfiles(data.profiles);
        setServices(data.services);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os clientes. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { clients, profiles, services, loading, error, refetch };
}

export function useClient(id: string) {
  const { clients, profiles, services, loading, error, refetch } = useClients();
  return {
    client: clients.find((client) => client.id === id),
    profiles,
    services,
    loading,
    error,
    refetch,
  };
}

async function syncClientServices(clientId: string, serviceNames: string[]) {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data: allServices, error: servicesError } = await supabase
    .from("services")
    .select("id, name");
  if (servicesError) throw servicesError;

  const serviceIds = (allServices ?? [])
    .filter((service) => serviceNames.includes(service.name))
    .map((service) => service.id);

  const { error: deleteError } = await supabase
    .from("client_services")
    .delete()
    .eq("client_id", clientId);
  if (deleteError) throw deleteError;

  if (serviceIds.length === 0) return;

  const { error: insertError } = await supabase.from("client_services").insert(
    serviceIds.map((serviceId) => ({
      organization_id: organizationId,
      client_id: clientId,
      service_id: serviceId,
    })),
  );
  if (insertError) throw insertError;
}

function toRowPayload(input: ClientInput, organizationId: string) {
  return {
    organization_id: organizationId,
    name: input.name,
    trade_name: input.tradeName || null,
    cnpj: input.cnpj || null,
    segment: input.segment,
    website: input.website || null,
    instagram: input.instagram || null,
    email: input.email || null,
    phone: input.phone || null,
    responsible_id: input.responsibleId,
    start_date: input.startDate || null,
    status: input.status,
    monthly_fee: input.monthlyFee,
    due_day: input.dueDay,
    payment_method: input.paymentMethod,
    notes: input.notes || null,
  };
}

export async function createClient(rawInput: ClientInput): Promise<Client> {
  const input = clientInputSchema.parse(rawInput);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("clients")
    .insert(toRowPayload(input, organizationId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar cliente.");

  await syncClientServices(data.id, input.services);

  return mapClient(data, new Map([[data.id, input.services]]));
}

export async function updateClient(id: string, rawInput: ClientInput): Promise<Client> {
  const input = clientInputSchema.parse(rawInput);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("clients")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar cliente.");

  await syncClientServices(id, input.services);

  return mapClient(data, new Map([[id, input.services]]));
}

export async function removeClient(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
