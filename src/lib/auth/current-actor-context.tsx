"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CurrentActor } from "@/lib/auth/get-current-actor";
import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";

const CurrentActorContext = createContext<CurrentActor | null>(null);

/**
 * Hydrates the actor resolved server-side (see getCurrentActor) into the
 * client tree. One fetch per request, not one per component — Header and
 * anything else that needs the signed-in user/profile/organization reads
 * it from here instead of calling Supabase again.
 */
export function CurrentActorProvider({
  actor,
  children,
}: {
  actor: CurrentActor;
  children: ReactNode;
}) {
  return <CurrentActorContext.Provider value={actor}>{children}</CurrentActorContext.Provider>;
}

/** Throws outside of CurrentActorProvider — every `(app)` page is wrapped by it via AppLayout. */
export function useCurrentActor(): CurrentActor {
  const actor = useContext(CurrentActorContext);
  if (!actor) {
    throw new Error("useCurrentActor must be used within a CurrentActorProvider.");
  }
  return actor;
}

/**
 * UI-level gate only — never the real enforcement. RLS (and, for
 * privileged server actions, an explicit server-side check) is what
 * actually protects the data; this just avoids showing a control the
 * user couldn't use anyway. See permissions.ts and the finance.* RLS
 * policies for the real gate.
 */
export function useHasPermission(key: PermissionKey): boolean {
  const actor = useCurrentActor();
  return hasPermission(actor.permissions, key);
}
