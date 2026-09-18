import { ZodError } from "zod";

/**
 * Every Data Layer's own thrown errors (assertXBelongsToOrg, "Falha ao
 * criar/atualizar X.") are plain `Error` instances with a short,
 * already-Portuguese, non-technical message meant to be shown as-is. A
 * Supabase/Postgrest error re-thrown unchanged is also an `Error`, but its
 * `.message` is raw database text (e.g. "duplicate key value violates
 * unique constraint ...") and carries a `code` property ours never do —
 * that's the only reliable way to tell them apart without wrapping every
 * Supabase call, so it falls back to `fallback` instead of leaking the
 * raw message to the user.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? fallback;
  if (error instanceof Error && !("code" in error)) return error.message;
  return fallback;
}
