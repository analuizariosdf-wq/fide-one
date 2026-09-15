import type { Client } from "@/lib/types";

export const clients: Client[] = [
  { id: "inovar", name: "Inovar", segment: "Educação" },
  { id: "pleno", name: "Pleno", segment: "Serviços Financeiros" },
  { id: "conservar", name: "Conservar", segment: "Sustentabilidade" },
  { id: "felipe-holanda", name: "Felipe Holanda", segment: "Consultoria" },
  { id: "vero", name: "Vero Saúde", segment: "Saúde" },
];

export function getClient(id: string | null): Client | undefined {
  return clients.find((client) => client.id === id);
}
