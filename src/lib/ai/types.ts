/**
 * Boundary for a future FIDE Assistant — no provider chosen, no API key,
 * nothing active. This module only documents the shape an integration
 * would plug into, so adding one later means implementing `AiProvider`
 * and wiring `resolveAiContext`, never restructuring the app around it.
 *
 * Design intent:
 * - The assistant only ever sees what the *requesting user* can already
 *   see — `resolveAiContext` is meant to be built from the same
 *   `CurrentActor`/`PermissionKey` system every page and RLS policy uses
 *   (src/lib/auth/permissions.ts), never a service_role-wide view.
 * - `finance.*` is included in the capability list on purpose, to make
 *   explicit that a future assistant must check `finance.view`/
 *   `finance.manage` before touching money data, exactly like the
 *   Financeiro UI and its RLS policies already do.
 * - No chat UI, no message history, no provider client lives here yet —
 *   this is intentionally just the contract.
 */

import type { PermissionKey } from "@/lib/auth/permissions";

/** The domains a future assistant could be authorized to read/act on. */
export type AiCapabilityDomain =
  | "clients"
  | "projects"
  | "tasks"
  | "contents"
  | "calendar"
  | "crm"
  | "tickets"
  | "reports"
  | "finance";

export interface AiContext {
  organizationId: string;
  userId: string;
  /** The exact same permission set the rest of the app already resolved for this user. */
  permissions: PermissionKey[];
}

export interface AiCapabilityCheck {
  domain: AiCapabilityDomain;
  allowed: boolean;
}

const DOMAIN_PERMISSION: Record<AiCapabilityDomain, PermissionKey> = {
  clients: "clients.view",
  projects: "projects.view",
  tasks: "tasks.view",
  contents: "contents.view",
  calendar: "calendar.view",
  crm: "crm.view",
  tickets: "tickets.view",
  reports: "reports.view",
  finance: "finance.view",
};

/** Never grants access on its own — just maps a domain to the same permission check everything else already uses. */
export function checkAiCapability(context: AiContext, domain: AiCapabilityDomain): AiCapabilityCheck {
  return { domain, allowed: context.permissions.includes(DOMAIN_PERMISSION[domain]) };
}

/**
 * A future provider integration implements this — deliberately minimal.
 * No implementation exists yet; this interface only exists so one can be
 * added without redesigning how the rest of the app calls into it.
 */
export interface AiProvider {
  name: string;
  ask(context: AiContext, prompt: string): Promise<string>;
}
