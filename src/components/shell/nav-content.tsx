"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navGroups } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { hasPermission } from "@/lib/auth/permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavContent({ collapsed, onNavigate }: NavContentProps) {
  const pathname = usePathname();
  const { permissions } = useCurrentActor();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(permissions, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {visibleGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-muted group-hover:text-sidebar-foreground",
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
