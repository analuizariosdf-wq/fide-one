import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getNotificationSender } from "@/lib/notifications";
import { isReminderDueNow } from "@/lib/notifications/reminder-schedule";

/**
 * Vercel Cron target (see vercel.json). Runs once a day, at 12:00 UTC
 * (09:00 America/Sao_Paulo) — Vercel's Hobby plan only allows daily cron
 * schedules, so this can't run more often. Across every organization at
 * once via service_role — that's exactly the case service_role bypassing
 * RLS is for (see the migration's own comment).
 *
 * Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET`
 * on requests it triggers when CRON_SECRET is set as an env var. Without
 * CRON_SECRET configured, the route fails closed (503) rather than
 * accepting unauthenticated calls.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();

  const { data: reminders, error: remindersError } = await supabase
    .from("task_reminders")
    .select("id, task_id, offset_days, remind_time, channel")
    .is("sent_at", null);

  if (remindersError) {
    return NextResponse.json({ error: remindersError.message }, { status: 500 });
  }
  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  const taskIds = [...new Set(reminders.map((r) => r.task_id))];
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, due_date, assignee_id")
    .in("id", taskIds);

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const tasksById = new Map((tasks ?? []).map((task) => [task.id, task]));
  const assigneeIds = [...new Set((tasks ?? []).map((task) => task.assignee_id).filter((id): id is string => Boolean(id)))];

  const { data: profiles, error: profilesError } = assigneeIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", assigneeIds)
    : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://fide-one-ten.vercel.app");

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    const task = tasksById.get(reminder.task_id);
    if (!task || !task.due_date) {
      skipped += 1;
      continue;
    }
    const scheduled = { offsetDays: reminder.offset_days, remindTime: reminder.remind_time };
    if (!isReminderDueNow(scheduled, task.due_date, now)) continue;

    const assignee = task.assignee_id ? profilesById.get(task.assignee_id) : undefined;
    const sender = getNotificationSender(reminder.channel);

    if (!assignee || !sender) {
      // No responsible profile, or the channel (e.g. whatsapp) has no
      // real sender yet — never mark sent_at for a reminder that wasn't
      // actually delivered.
      skipped += 1;
      continue;
    }

    try {
      await sender.send({
        to: assignee.email,
        recipientName: assignee.name,
        taskTitle: task.title,
        dueDate: task.due_date,
        taskUrl: `${siteUrl}/tasks/${task.id}`,
      });
      await supabase.from("task_reminders").update({ sent_at: new Date().toISOString() }).eq("id", reminder.id);
      sent += 1;
    } catch (error) {
      // Surfaced in the response (Vercel Cron logs every response body)
      // instead of swallowed — a misconfigured RESEND_API_KEY/
      // RESEND_FROM_EMAIL must be visible, not just an opaque "skipped".
      skipped += 1;
      errors.push(`reminder ${reminder.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
