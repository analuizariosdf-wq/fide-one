import { getPageTitle } from "@/lib/nav-config";
import { getClient } from "@/lib/mock-data/clients";
import { getProject } from "@/lib/mock-data/projects";
import { getTask } from "@/lib/mock-data/tasks";
import { getContent } from "@/lib/mock-data/contents";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const DETAIL_ROUTES: {
  pattern: RegExp;
  listLabel: string;
  listHref: string;
  resolve: (id: string) => string | undefined;
}[] = [
  {
    pattern: /^\/clients\/([^/]+)$/,
    listLabel: "Clientes",
    listHref: "/clients",
    resolve: (id) => getClient(id)?.name,
  },
  {
    pattern: /^\/projects\/([^/]+)$/,
    listLabel: "Projetos",
    listHref: "/projects",
    resolve: (id) => getProject(id)?.name,
  },
  {
    pattern: /^\/tasks\/([^/]+)$/,
    listLabel: "Tarefas",
    listHref: "/tasks",
    resolve: (id) => getTask(id)?.title,
  },
  {
    pattern: /^\/contents\/([^/]+)$/,
    listLabel: "Conteúdos",
    listHref: "/contents",
    resolve: (id) => getContent(id)?.title,
  },
];

/**
 * Resolves the Header's title into breadcrumb segments for detail pages
 * ("Tarefas / Revisar copy do Reel"), falling back to the plain page
 * title everywhere else.
 */
export function getBreadcrumb(pathname: string): BreadcrumbSegment[] {
  for (const route of DETAIL_ROUTES) {
    const match = pathname.match(route.pattern);
    if (match) {
      const entityLabel = route.resolve(match[1]) ?? "Não encontrado";
      return [
        { label: route.listLabel, href: route.listHref },
        { label: entityLabel },
      ];
    }
  }

  return [{ label: getPageTitle(pathname) }];
}
