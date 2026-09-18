"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { getAccentColorStyle } from "@/lib/branding-style";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { organization } = useCurrentActor();

  useEffect(() => {
    document.title = organization?.displayName || organization?.name || "FIDE ONE";
  }, [organization?.displayName, organization?.name]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      style={getAccentColorStyle(organization?.accentColor)}
    >
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
