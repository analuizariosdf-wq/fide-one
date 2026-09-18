/**
 * Pure scheduling logic for the task-reminders cron (kept separate from
 * the route so it's easy to reason about/exercise in isolation — the
 * route itself needs a live DB and Resend, this function needs neither).
 *
 * The cron is expected to run hourly. A reminder with no remind_time
 * fires on the first run of its target day; one with a remind_time
 * fires on the first run at or after that time (UTC) on the target day.
 */
export function isReminderDueNow(
  reminder: { offsetDays: number; remindTime: string | null },
  dueDateISO: string,
  now: Date,
): boolean {
  const due = new Date(`${dueDateISO}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return false;

  const target = new Date(due);
  target.setUTCDate(target.getUTCDate() - reminder.offsetDays);

  const todayISO = now.toISOString().slice(0, 10);
  const targetISO = target.toISOString().slice(0, 10);
  if (todayISO !== targetISO) return false;

  if (!reminder.remindTime) return true;

  const [hours, minutes] = reminder.remindTime.split(":").map((part) => Number(part));
  const remindMinutes = hours * 60 + (minutes || 0);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return nowMinutes >= remindMinutes;
}
