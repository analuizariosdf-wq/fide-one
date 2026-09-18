import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireServerPermission } from "@/lib/auth/require-permission-server";

/**
 * The only place in the app that touches the Admin API / service_role —
 * always server-side, never imported by a Client Component, key never
 * prefixed with NEXT_PUBLIC. Permission is re-checked here regardless of
 * what the UI already hid, since this is the privileged operation the
 * whole permission system exists to gate.
 */
export async function POST(request: Request) {
  let organizationId: string;
  try {
    ({ organizationId } = await requireServerPermission("team.manage"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não autorizado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const roleSlug = typeof body?.roleSlug === "string" ? body.roleSlug : null;

  if (!name || !email) {
    return NextResponse.json({ error: "Informe nome e e-mail." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // The on_auth_user_created trigger (see the Etapa 4 profiles migration)
  // reads organization_id/name/role_slug from raw_user_meta_data and
  // creates the `profiles` row itself — this route never inserts into
  // profiles directly, so there is exactly one code path that creates a
  // profile, whether it's this invite or the deploy workflow's seed.
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: organizationId, name, role_slug: roleSlug ?? undefined },
  });

  if (error) {
    const alreadyExists = error.code === "email_exists" || error.code === "user_already_exists";
    const rateLimited = error.code === "over_email_send_rate_limit";
    const message = alreadyExists
      ? "Este e-mail já está cadastrado."
      : rateLimited
        ? "Limite de envio de e-mail do Supabase atingido — tente novamente em instantes."
        : "Não foi possível enviar o convite.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
