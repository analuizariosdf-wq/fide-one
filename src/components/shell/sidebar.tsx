"use client";

import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { NavContent } from "@/components/shell/nav-content";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { organization } = useCurrentActor();
  const brandName = organization?.displayName || organization?.name || "FIDE ONE";

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          {organization?.logoUrl ? (
            <Image
              src={organization.logoUrl}
              alt={brandName}
              width={28}
              height={28}
              unoptimized
              className="size-7 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
              {brandName.charAt(0).toUpperCase()}
            </span>
          )}
          {!collapsed && (
            <span className="truncate text-[14px] font-semibold tracking-tight text-sidebar-foreground">
              {brandName}
            </span>
          )}
        </Link>
      </div>

      <NavContent collapsed={collapsed} />
    </aside>
  );
}
