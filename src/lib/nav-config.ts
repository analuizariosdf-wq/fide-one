import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  FolderKanban,
  Images,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operação",
    items: [
      { label: "Clientes", href: "/clients", icon: Users },
      { label: "Projetos", href: "/projects", icon: FolderKanban },
      { label: "Tarefas", href: "/tasks", icon: ListChecks },
      { label: "Conteúdos", href: "/conteudos", icon: Images },
      { label: "Calendário", href: "/calendario", icon: Calendar },
    ],
  },
  {
    label: "Gestão / Financeiro",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: Wallet },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Equipe",
    items: [{ label: "Equipe", href: "/equipe", icon: UsersRound }],
  },
  {
    label: "Sistema",
    items: [{ label: "Configurações", href: "/configuracoes", icon: Settings }],
  },
];
