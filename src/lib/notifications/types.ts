/**
 * Channel is deliberately the same plain-text union as
 * task_reminders.channel — WhatsApp already has a schema/type home so
 * adding a real WhatsApp sender later is a new file here, not a
 * migration or a type change.
 */
export type NotificationChannel = "email" | "whatsapp";

export interface ReminderNotification {
  to: string;
  recipientName: string;
  taskTitle: string;
  dueDate: string;
  taskUrl: string;
}

export interface NotificationSender {
  channel: NotificationChannel;
  send(notification: ReminderNotification): Promise<void>;
}
