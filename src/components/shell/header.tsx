"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, PanelLeft, Search } from "lucide-react";

import { getPageTitle } from "@/lib/nav-config";
import { getTeamMember } from "@/lib/mock-data/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const title = getPageTitle(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = getTeamMember("daniel");

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

      <h1 className="hidden shrink-0 text-[15px] font-semibold text-foreground sm:block">
        {title}
      </h1>

      <div className="mx-auto w-full max-w-md flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar clientes, tarefas, conteúdos..."
            className="h-9 rounded-full pl-9"
            aria-label="Busca global"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notificações"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-[13px] text-foreground">
                Mariana comentou no projeto &quot;Pleno&quot;
              </span>
              <span className="text-[12px] text-muted-foreground">há 1 hora</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-[13px] text-foreground">
                3 conteúdos aguardando aprovação
              </span>
              <span className="text-[12px] text-muted-foreground">há 3 horas</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-[13px] text-foreground">
                Novo pagamento registrado
              </span>
              <span className="text-[12px] text-muted-foreground">há 3 horas</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="Menu do perfil"
            >
              <Avatar className="size-7">
                <AvatarFallback>{user?.initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-foreground">
                {user?.name}
              </span>
              <span className="text-[12px] font-normal text-muted-foreground">
                {user?.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Meu perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
