"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Client } from "@/lib/types";
import { useClients, type ClientFilters, removeClient } from "@/lib/services/clients-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientFiltersBar } from "@/components/clients/client-filters";
import { ClientTable } from "@/components/clients/client-table";
import { ClientFormDrawer } from "@/components/clients/client-form-drawer";

export default function ClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>({});
  const clients = useClients(filters);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

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

      <ClientFiltersBar filters={filters} onChange={setFilters} />

      <Card>
        <CardContent className="pt-5">
          <ClientTable
            clients={clients}
            onEdit={(client) => {
              setEditingClient(client);
              setDrawerOpen(true);
            }}
            onDelete={(client) => setDeletingClient(client)}
          />
        </CardContent>
      </Card>

      <ClientFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        client={editingClient}
      />

      <ConfirmDialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => !open && setDeletingClient(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deletingClient?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deletingClient) return;
          removeClient(deletingClient.id);
          toast.success("Cliente excluído.");
        }}
      />
    </div>
  );
}
