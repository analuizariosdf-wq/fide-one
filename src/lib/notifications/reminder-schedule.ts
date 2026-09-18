/**
 * Pure scheduling logic for the task-reminders cron (kept separate from
 * the route so it's easy to reason about/exercise in isolation — the
 * route itself needs a live DB and Resend, this function needs neither).
 *
 * The cron runs once a day (Vercel Hobby plan only allows daily cron
 * schedules — see vercel.json). With a single run per day there's no way
 * to honor an exact remind_time (a reminder set for later in the day
 * than the cron's run time would otherwise never be caught, since the
 * target day only matches once): a reminder is due as soon as "today" is
 * its target day, and remind_time is kept only as the user's stored
 * preference/informational value, not as a same-day gate.
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
  return todayISO === targetISO;
}
