"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Client, ClientStatus } from "@/lib/types";
import { clientsStore } from "@/lib/store/clients-store";

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | "todos";
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

export function useClients(filters: ClientFilters = {}): Client[] {
  const items = useSyncExternalStore(
    clientsStore.subscribe,
    clientsStore.getSnapshot,
    clientsStore.getSnapshot,
  );

  return useMemo(() => filterClients(items, filters), [items, filters]);
}

export function useClient(id: string): Client | undefined {
  const items = useSyncExternalStore(
    clientsStore.subscribe,
    clientsStore.getSnapshot,
    clientsStore.getSnapshot,
  );

  return useMemo(() => items.find((client) => client.id === id), [items, id]);
}

export type ClientInput = Omit<Client, "id">;

export function createClient(input: ClientInput): Client {
  const client: Client = { id: crypto.randomUUID(), ...input };
  return clientsStore.create(client);
}

export function updateClient(id: string, patch: Partial<ClientInput>): Client | undefined {
  return clientsStore.update(id, patch);
}

export function removeClient(id: string): void {
  clientsStore.remove(id);
}
