"use client";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { NotificationChannel } from "@/lib/notifications";
import type { Tables } from "@/lib/supabase/database.types";

export interface TaskReminder {
  id: string;
  taskId: string;
  offsetDays: number;
  remindTime: string | null;
  channel: NotificationChannel;
  sentAt: string | null;
}

function mapReminder(row: Tables<"task_reminders">): TaskReminder {
  return {
    id: row.id,
    taskId: row.task_id,
    offsetDays: row.offset_days,
    remindTime: row.remind_time,
    channel: row.channel,
    sentAt: row.sent_at,
  };
}

export async function loadTaskReminders(taskId: string): Promise<TaskReminder[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("task_reminders")
    .select("*")
    .eq("task_id", taskId)
    .order("offset_days", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReminder);
}

export interface TaskReminderInput {
  offsetDays: number;
  remindTime: string | null;
  channel: NotificationChannel;
}

export async function createTaskReminder(taskId: string, input: TaskReminderInput): Promise<TaskReminder> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("task_reminders")
    .insert({
      organization_id: organizationId,
      task_id: taskId,
      offset_days: input.offsetDays,
      remind_time: input.remindTime,
      channel: input.channel,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar lembrete.");
  return mapReminder(data);
}

export async function removeTaskReminder(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("task_reminders").delete().eq("id", id);
  if (error) throw error;
}
