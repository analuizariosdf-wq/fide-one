"use client";

import { useRouter } from "next/navigation";

import type { Task } from "@/lib/types";
import { isOverdue, toISODate } from "@/lib/format";
import { getMonthGridDays, isSameDay, isSameMonth, WEEKDAY_LABELS } from "@/lib/calendar-utils";
import { taskUrgencyConfig } from "@/lib/status";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_PER_DAY = 4;

interface TaskCalendarViewProps {
  referenceDate: Date;
  tasks: Task[];
}

/**
 * Groups tasks by due_date only — no new table, due_date stays the single
 * source of truth. Same grid conventions as the Calendário month view
 * (calendar-utils), kept as a separate component since tasks aren't
 * CalendarItems and don't go through EventChip.
 */
export function TaskCalendarView({ referenceDate, tasks }: TaskCalendarViewProps) {
  const router = useRouter();
  const days = getMonthGridDays(referenceDate);
  const today = new Date();

  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = tasksByDate.get(task.dueDate) ?? [];
    list.push(task);
    tasksByDate.set(task.dueDate, list);
  }
  for (const list of tasksByDate.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTasks = tasksByDate.get(toISODate(day)) ?? [];
            const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY);
            const overflow = dayTasks.length - visible.length;
            const inMonth = isSameMonth(day, referenceDate);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={toISODate(day)}
                className={cn(
                  "flex min-h-32 flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/20",
                  isToday && "bg-accent/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[12px] font-medium",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visible.map((task) => {
                    const priority = taskUrgencyConfig[task.priority];
                    const overdue = task.status !== "concluido" && isOverdue(task.dueDate);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] font-medium transition-colors hover:bg-muted",
                          overdue ? "text-status-danger-fg" : "text-foreground",
                        )}
                      >
                        <span className={cn("size-1.5 shrink-0 rounded-full", priority.dotClass)} aria-hidden />
                        <span className="truncate">{task.title}</span>
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="px-1.5 text-[11px] font-medium text-primary">+{overflow} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
