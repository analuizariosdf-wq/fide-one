import { NextResponse } from "next/server";

import { getNotificationSender } from "@/lib/notifications";

/**
 * Manual test-send for the reminders e-mail integration — lets someone
 * confirm Resend/RESEND_FROM_EMAIL work end-to-end without waiting for
 * the once-a-day cron (see ../route.ts). Not linked from any UI.
 *
 * Reuses the exact same auth as the cron route (CRON_SECRET bearer
 * token) rather than inventing a second secret, and the exact same
 * `emailSender` the cron uses — this never becomes a second send path,
 * just a manual trigger of the one that already exists.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  if (!to) {
    return NextResponse.json({ error: 'Informe o destinatário em "to" no corpo da requisição.' }, { status: 400 });
  }

  const sender = getNotificationSender("email");
  if (!sender) {
    return NextResponse.json({ error: "Canal de e-mail indisponível." }, { status: 500 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://fide-one-ten.vercel.app");

  try {
    await sender.send({
      to,
      recipientName: "Teste FIDE ONE",
      taskTitle: "E-mail de teste da integração Resend",
      dueDate: new Date().toISOString().slice(0, 10),
      taskUrl: siteUrl,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail de teste.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
