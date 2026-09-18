"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Menu, PanelLeft } from "lucide-react";

import { useBreadcrumb } from "@/lib/breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { toInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavContent } from "@/components/shell/nav-content";

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Header({ collapsed, onToggleCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumb = useBreadcrumb(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { profile, role } = useCurrentActor();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <PanelLeft className="size-4" />
      </Button>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-4" />
        </Button>
        <SheetContent side="left" className="w-[248px] p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle>FIDE ONE</SheetTitle>
          </SheetHeader>
          <NavContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="hidden min-w-0 flex-1 items-center gap-1.5 text-[15px] font-semibold text-foreground sm:flex">
        {breadcrumb.map((segment, index) => (
          <span key={index} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {segment.href ? (
              <Link
                href={segment.href}
                className="shrink-0 font-medium text-muted-foreground hover:text-foreground"
              >
                {segment.label}
              </Link>
            ) : (
              <span className="truncate">{segment.label}</span>
            )}
          </span>
        ))}
      </h1>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-3 text-[13px] text-muted-foreground">
              Central de notificações ainda não disponível.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="Menu do perfil"
            >
              <Avatar className="size-7">
                <AvatarFallback>{profile ? toInitials(profile.name) : "—"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-foreground">
                {profile?.name ?? "Perfil não encontrado"}
              </span>
              <span className="text-[12px] font-normal text-muted-foreground">
                {role?.name ?? ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/equipe")}>Meu perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
