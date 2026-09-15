"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Client } from "@/lib/types";
import { useClients, filterClients, removeClient, type ClientFilters } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { ClientFiltersBar } from "@/components/clients/client-filters";
import { ClientTable } from "@/components/clients/client-table";
import { ClientFormDrawer } from "@/components/clients/client-form-drawer";

export default function ClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>({});
  const { clients, profiles, services, loading, error, refetch } = useClients();
  const filteredClients = useMemo(() => filterClients(clients, filters), [clients, filters]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  async function handleConfirmDelete() {
    if (!deletingClient) return;
    try {
      await removeClient(deletingClient.id);
      toast.success("Cliente excluído.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir o cliente. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes e acompanhe a operação de cada conta."
        action={
          <Button
            onClick={() => {
              setEditingClient(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      <ClientFiltersBar filters={filters} onChange={setFilters} profiles={profiles} services={services} />

      <Card>
        <CardContent className="pt-5">
          {error ? (
            <ErrorState description={error} onRetry={refetch} />
          ) : (
            <ClientTable
              clients={filteredClients}
              loading={loading}
              onEdit={(client) => {
                setEditingClient(client);
                setDrawerOpen(true);
              }}
              onDelete={(client) => setDeletingClient(client)}
            />
          )}
        </CardContent>
      </Card>

      <ClientFormDrawer
        key={editingClient?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        client={editingClient}
        profiles={profiles}
        services={services}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => !open && setDeletingClient(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deletingClient?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
