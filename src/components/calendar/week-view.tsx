import type { CalendarItem } from "@/lib/types";
import { toISODate } from "@/lib/format";
import { formatDayLabel, getWeekDays, isSameDay } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { EventChip } from "@/components/calendar/event-chip";

interface WeekViewProps {
  referenceDate: Date;
  items: CalendarItem[];
  onOpenEvent: (item: CalendarItem) => void;
}

export function WeekView({ referenceDate, items, onOpenEvent }: WeekViewProps) {
  const days = getWeekDays(referenceDate);
  const today = new Date();

  const itemsByDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = itemsByDate.get(item.date) ?? [];
    list.push(item);
    itemsByDate.set(item.date, list);
  }
  for (const list of itemsByDate.values()) {
    list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {days.map((day) => {
        const dayItems = itemsByDate.get(toISODate(day)) ?? [];
        const isToday = isSameDay(day, today);

        return (
          <div key={toISODate(day)} className="flex flex-col gap-2 p-3 sm:flex-row sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 sm:w-44">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[12px] font-medium",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {formatDayLabel(day)}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {dayItems.length === 0 ? (
                <span className="text-[12px] text-muted-foreground">Nenhum item</span>
              ) : (
                dayItems.map((item) => (
                  <EventChip key={item.id} item={item} onOpenEvent={onOpenEvent} className="px-2" />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
