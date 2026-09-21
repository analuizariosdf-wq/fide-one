import { NextResponse } from "next/server";

import { requireServerPermission } from "@/lib/auth/require-permission-server";
import { sendRawEmail } from "@/lib/notifications/email-sender";

/**
 * Backs the "Enviar e-mail de teste" button in Configurações > E-mail /
 * Notificações. Unlike /api/cron/task-reminders/test (which authenticates
 * via CRON_SECRET, for Vercel Cron / a shell with no browser session),
 * this route is a normal authenticated route: it goes through the
 * regular middleware session gate AND re-checks settings.manage here
 * server-side (never trust that the button was hidden client-side) —
 * same pattern as /api/team/invite. The browser never sees CRON_SECRET
 * or RESEND_API_KEY; it only ever gets a JSON { ok } or { error }.
 */
export async function POST(request: Request) {
  try {
    await requireServerPermission("settings.manage");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não autorizado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    if (!to || !to.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail de destino válido." }, { status: 400 });
    }

    await sendRawEmail({
      to,
      subject: "Teste de e-mail — FIDE ONE",
      html: "<p>Se você recebeu esta mensagem, a integração de e-mail do FIDE ONE está funcionando corretamente.</p>",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail de teste.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
