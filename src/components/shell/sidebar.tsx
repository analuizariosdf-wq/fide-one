"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { NavContent } from "@/components/shell/nav-content";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
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
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            F
          </span>
          {!collapsed && (
            <span className="text-[14px] font-semibold tracking-tight text-sidebar-foreground">
              FIDE ONE
            </span>
          )}
        </Link>
      </div>

      <NavContent collapsed={collapsed} />
    </aside>
  );
}
