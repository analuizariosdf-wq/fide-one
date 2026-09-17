/**
 * Backs the "resolve a real Supabase entity's name for a UUID id" bridges
 * in mock-data/{clients,projects,tasks,contents}.ts (see the comment next
 * to each `registerSupabaseX`). A plain `Map` worked for components that
 * read it from inside the same render tree that populates it (e.g.
 * ClientTable, fed by the same useClients() call that registers profiles)
 * — the write always lands before React re-renders that subtree with the
 * new data.
 *
 * The breadcrumb in src/components/shell/header.tsx is a sibling of the
 * page doing the fetching, not a descendant, so nothing forces Header to
 * re-render once the entity page's own load resolves — on a hard
 * navigation straight to /clients/<uuid>, the breadcrumb would read the
 * cache before it's ever populated and never notice it changed. This
 * wraps the same Map with a version counter + subscribe, so
 * useBreadcrumb() (see breadcrumb.ts) can use useSyncExternalStore to
 * re-render Header exactly when an entry actually gets registered.
 */
export interface NameCache<T> {
  register: (item: T) => void;
  get: (id: string) => T | undefined;
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
}

export function createNameCache<T extends { id: string }>(): NameCache<T> {
  const entries = new Map<string, T>();
  const listeners = new Set<() => void>();
  let version = 0;

  return {
    register(item) {
      entries.set(item.id, item);
      version++;
      for (const listener of listeners) listener();
    },
    get(id) {
      return entries.get(id);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion() {
      return version;
    },
  };
}
