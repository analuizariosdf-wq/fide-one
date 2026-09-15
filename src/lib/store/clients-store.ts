import { clients } from "@/lib/mock-data/clients";
import type { Client } from "@/lib/types";
import { createEntityStore } from "@/lib/store/create-entity-store";

export const clientsStore = createEntityStore<Client>(clients);
