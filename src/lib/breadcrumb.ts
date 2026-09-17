"use client";

import { useSyncExternalStore } from "react";

import { getPageTitle } from "@/lib/nav-config";
import { getClient, supabaseClientCache } from "@/lib/mock-data/clients";
import { getProject, supabaseProjectCache } from "@/lib/mock-data/projects";
import { getTask, supabaseTaskCache } from "@/lib/mock-data/tasks";
import { getContent, supabaseContentCache } from "@/lib/mock-data/contents";

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

const ALL_CACHES = [
  supabaseClientCache,
  supabaseProjectCache,
  supabaseTaskCache,
  supabaseContentCache,
];

function subscribeToAllCaches(onChange: () => void): () => void {
  const unsubscribes = ALL_CACHES.map((cache) => cache.subscribe(onChange));
  return () => {
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
}

function getCombinedCacheVersion(): number {
  return ALL_CACHES.reduce((total, cache) => total + cache.getVersion(), 0);
}

/**
 * getBreadcrumb() alone reads a plain (if observable) module cache — fine
 * for a component that re-renders anyway, but Header is a sibling of the
 * page that populates the cache, not a descendant, so nothing would ever
 * tell it to re-render once that page's own fetch resolves. This
 * subscribes to every entity-name cache so a hard navigation straight to
 * a detail page (/clients/<uuid>, ...) still ends up showing the real
 * name instead of getting stuck on "Não encontrado".
 */
export function useBreadcrumb(pathname: string): BreadcrumbSegment[] {
  useSyncExternalStore(subscribeToAllCaches, getCombinedCacheVersion, getCombinedCacheVersion);
  return getBreadcrumb(pathname);
}
