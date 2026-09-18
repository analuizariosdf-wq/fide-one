"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useTickets } from "@/lib/data/tickets";
import { useHasPermission } from "@/lib/auth/current-actor-context";
import { RequirePermission } from "@/components/shared/require-permission";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFormDrawer } from "@/components/tickets/ticket-form-drawer";

export default function TicketsPage() {
  return (
    <RequirePermission permission="tickets.view">
      <TicketsContent />
    </RequirePermission>
  );
}

function TicketsContent() {
  const canManage = useHasPermission("tickets.manage");
  const { tickets, clients, projects, profiles, loading, error, refetch } = useTickets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets"
        description="Chamados internos e comunicação documentada."
        action={
          canManage && (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" />
              Novo ticket
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <TicketTable tickets={tickets} clients={clients} profiles={profiles} />
          </CardContent>
        </Card>
      )}

      <TicketFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} clients={clients} projects={projects} profiles={profiles} onSaved={refetch} />
    </div>
  );
}
