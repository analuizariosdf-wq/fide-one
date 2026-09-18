/**
 * The full permission catalog — mirrors the rows seeded into
 * `public.permissions` (supabase/migrations/20260918000001_permissions.sql).
 * Adding a permission means inserting a row there + adding the key here;
 * nothing in the app ever branches on a role slug directly (no
 * `if (role === "diretor")`) — every gate checks a capability instead, so
 * a new role just needs the right rows in `role_permissions`.
 */
export const PERMISSION_KEYS = [
  "dashboard.view",
  "clients.view",
  "clients.manage",
  "projects.view",
  "projects.manage",
  "tasks.view",
  "tasks.manage",
  "contents.view",
  "contents.manage",
  "calendar.view",
  "calendar.manage",
  "crm.view",
  "crm.manage",
  "growth.view",
  "growth.manage",
  "tickets.view",
  "tickets.manage",
  "reports.view",
  "finance.view",
  "finance.manage",
  "team.view",
  "team.manage",
  "settings.view",
  "settings.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export function hasPermission(
  permissions: readonly PermissionKey[] | undefined,
  key: PermissionKey,
): boolean {
  return Boolean(permissions?.includes(key));
}
