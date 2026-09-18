import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireServerPermission } from "@/lib/auth/require-permission-server";

/**
 * Deactivating/reactivating access requires the Admin API (banning a user
 * isn't something the anon key can do), so — like the invite route —
 * this only ever runs server-side. `profiles.deactivated_at` is set in
 * the same request so the Equipe UI (which can't read auth.users) has
 * something RLS-safe to read.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let organizationId: string;
  try {
    ({ organizationId } = await requireServerPermission("team.manage"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não autorizado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== "deactivate" && action !== "reactivate") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Confirm the target profile really belongs to the caller's organization
  // before touching auth.users — service_role bypasses RLS, so this check
  // has to happen explicitly here instead.
  const { data: target } = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle();
  if (!target || target.organization_id !== organizationId) {
    return NextResponse.json({ error: "Membro não encontrado nesta organização." }, { status: 404 });
  }

  const { error: banError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: action === "deactivate" ? "876000h" : "none",
  });
  if (banError) {
    return NextResponse.json({ error: "Não foi possível atualizar o acesso deste membro." }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ deactivated_at: action === "deactivate" ? new Date().toISOString() : null })
    .eq("id", id);
  if (profileError) {
    return NextResponse.json({ error: "Acesso atualizado, mas houve falha ao refletir o status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
