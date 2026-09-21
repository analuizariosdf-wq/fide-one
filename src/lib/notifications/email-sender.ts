import type { NotificationSender, ReminderNotification } from "@/lib/notifications/types";

/**
 * Calls the Resend API directly over fetch instead of adding the `resend`
 * package — one HTTP call, no new dependency. Server-only: reads
 * RESEND_API_KEY/RESEND_FROM_EMAIL from process.env, never hardcoded,
 * never sent to the browser. Throws if either is missing so a
 * misconfigured deployment fails loudly (visible in the cron route's
 * response/logs) rather than silently dropping reminders or falling back
 * to a sender address nobody actually verified in Resend.
 */
export const emailSender: NotificationSender = {
  channel: "email",
  async send(notification: ReminderNotification) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada — impossível enviar lembrete por e-mail.");
    }

    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) {
      throw new Error("RESEND_FROM_EMAIL não configurada — impossível enviar lembrete por e-mail.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: notification.to,
        subject: `Lembrete: ${notification.taskTitle}`,
        html: `
          <p>Olá, ${notification.recipientName}.</p>
          <p>A tarefa <strong>${notification.taskTitle}</strong> vence em <strong>${notification.dueDate}</strong>.</p>
          <p><a href="${notification.taskUrl}">Abrir tarefa</a></p>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Falha ao enviar e-mail via Resend (${response.status}): ${body}`);
    }
  },
};
