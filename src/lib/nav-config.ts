import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  FolderKanban,
  Images,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Sparkles,
  Ticket,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

import type { PermissionKey } from "@/lib/auth/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omitted = always visible (e.g. Dashboard, the IA teaser). */
  permission?: PermissionKey;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function getPageTitle(pathname: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return "FIDE ONE";
}

export const navGroups: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view" }],
  },
  {
    label: "Crescimento",
    items: [
      { label: "Crescimento", href: "/growth", icon: LineChart, permission: "growth.view" },
      { label: "Comercial", href: "/crm", icon: Users, permission: "crm.view" },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Clientes", href: "/clients", icon: Users, permission: "clients.view" },
      { label: "Projetos", href: "/projects", icon: FolderKanban, permission: "projects.view" },
      { label: "Tarefas", href: "/tasks", icon: ListChecks, permission: "tasks.view" },
      { label: "Conteúdos", href: "/contents", icon: Images, permission: "contents.view" },
      { label: "Calendário", href: "/calendar", icon: Calendar, permission: "calendar.view" },
    ],
  },
  {
    label: "Comunicação",
    items: [{ label: "Tickets", href: "/tickets", icon: Ticket, permission: "tickets.view" }],
  },
  {
    label: "Gestão",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: Wallet, permission: "finance.view" },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    label: "Equipe",
    items: [{ label: "Equipe", href: "/equipe", icon: UsersRound, permission: "team.view" }],
  },
  {
    label: "Sistema",
    items: [{ label: "Configurações", href: "/configuracoes", icon: Settings, permission: "settings.view" }],
  },
  {
    label: "Futuro",
    items: [{ label: "Assistente IA", href: "/assistente-ia", icon: Sparkles }],
  },
];
