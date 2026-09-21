import type { NotificationSender, ReminderNotification } from "@/lib/notifications/types";

interface RawEmail {
  to: string;
  subject: string;
  html: string;
}

/**
 * The one place that actually calls the Resend API over fetch — no
 * `resend` package, one HTTP call. Server-only: reads RESEND_API_KEY/
 * RESEND_FROM_EMAIL from process.env, never hardcoded, never sent to the
 * browser. Throws if either is missing so a misconfigured deployment
 * fails loudly (visible in whichever caller's response/logs) rather than
 * silently dropping mail or falling back to a sender nobody verified in
 * Resend. Both `emailSender` (task reminders) and the admin "send a test
 * e-mail" endpoint go through this — one source of truth for the Resend
 * call and its error handling, two different subject/body builders on
 * top of it.
 */
export async function sendRawEmail({ to, subject, html }: RawEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada — impossível enviar e-mail.");
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL não configurada — impossível enviar e-mail.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Resend (${response.status}): ${body}`);
  }
}

export const emailSender: NotificationSender = {
  channel: "email",
  async send(notification: ReminderNotification) {
    await sendRawEmail({
      to: notification.to,
      subject: `Lembrete: ${notification.taskTitle}`,
      html: `
        <p>Olá, ${notification.recipientName}.</p>
        <p>A tarefa <strong>${notification.taskTitle}</strong> vence em <strong>${notification.dueDate}</strong>.</p>
        <p><a href="${notification.taskUrl}">Abrir tarefa</a></p>
      `,
    });
  },
};
