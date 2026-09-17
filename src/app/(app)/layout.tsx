import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { CurrentActorProvider } from "@/lib/auth/current-actor-context";

// Server Component: resolves the signed-in user/profile/organization once
// per request (middleware already guarantees a session exists for every
// route under this layout) and hands it down via context, instead of
// every client component fetching it again on mount.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await getCurrentActor();

  return (
    <CurrentActorProvider actor={actor}>
      <AppShell>{children}</AppShell>
    </CurrentActorProvider>
  );
}
