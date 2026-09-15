/**
 * Minimal observable store for an in-memory collection, keyed by `id`.
 * Backs the mock CRUD for Clientes/Projetos/Tarefas via React's
 * `useSyncExternalStore` — no extra state-management dependency.
 *
 * The store itself never touches Supabase; when persistence lands, the
 * `list/get/create/update/remove` methods are the seam to swap for real
 * network calls, and every consumer (hooks, services) keeps working.
 */
export interface EntityStore<T extends { id: string }> {
  getSnapshot: () => T[];
  subscribe: (listener: () => void) => () => void;
  list: () => T[];
  get: (id: string) => T | undefined;
  create: (item: T) => T;
  update: (id: string, patch: Partial<T>) => T | undefined;
  remove: (id: string) => void;
}

export function createEntityStore<T extends { id: string }>(
  seed: T[],
): EntityStore<T> {
  let items = [...seed];
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => items,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    list: () => items,
    get: (id) => items.find((item) => item.id === id),
    create: (item) => {
      items = [item, ...items];
      notify();
      return item;
    },
    update: (id, patch) => {
      items = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
      notify();
      return items.find((item) => item.id === id);
    },
    remove: (id) => {
      items = items.filter((item) => item.id !== id);
      notify();
    },
  };
}
