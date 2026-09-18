import type { NotificationChannel, NotificationSender } from "@/lib/notifications/types";
import { emailSender } from "@/lib/notifications/email-sender";

export type { NotificationChannel, NotificationSender, ReminderNotification } from "@/lib/notifications/types";

/**
 * "whatsapp" resolves to `null` on purpose — there is no sender yet and
 * there must be no fake one. Callers (the reminders cron) skip whatsapp
 * reminders explicitly instead of pretending to send them; the UI shows
 * "WhatsApp — integração futura" wherever a channel is picked so nobody
 * configures a reminder that silently never fires.
 */
const senders: Record<NotificationChannel, NotificationSender | null> = {
  email: emailSender,
  whatsapp: null,
};

export function getNotificationSender(channel: NotificationChannel): NotificationSender | null {
  return senders[channel];
}
