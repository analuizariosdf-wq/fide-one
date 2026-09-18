"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import { useHasPermission } from "@/lib/auth/current-actor-context";
import type { PermissionKey } from "@/lib/auth/permissions";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * UI-level gate only — a page wrapped in this still relies on RLS to
 * actually protect its data (see the finance.* policies for the clearest
 * example). This just avoids rendering a module's controls/numbers for
 * someone whose role doesn't include the permission, with a clear message
 * instead of a confusing empty screen or a raw RLS error.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionKey;
  children: ReactNode;
}) {
  const allowed = useHasPermission(permission);

  if (!allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Sem permissão"
        description="Você não tem acesso a esta área do FIDE ONE."
      />
    );
  }

  return <>{children}</>;
}
