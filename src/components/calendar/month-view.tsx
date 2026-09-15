import type { CalendarItem } from "@/lib/types";
import { toISODate } from "@/lib/format";
import { getMonthGridDays, isSameDay, isSameMonth, WEEKDAY_LABELS } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { EventChip } from "@/components/calendar/event-chip";

const MAX_VISIBLE_PER_DAY = 3;

interface MonthViewProps {
  referenceDate: Date;
  items: CalendarItem[];
  onOpenEvent: (item: CalendarItem) => void;
  onShowMore: (day: Date) => void;
}

export function MonthView({ referenceDate, items, onOpenEvent, onShowMore }: MonthViewProps) {
  const days = getMonthGridDays(referenceDate);
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
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[720px]">
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
          const dayItems = itemsByDate.get(toISODate(day)) ?? [];
          const visible = dayItems.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayItems.length - visible.length;
          const inMonth = isSameMonth(day, referenceDate);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={toISODate(day)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
                !inMonth && "bg-muted/20",
              )}
            >
              <button
                type="button"
                onClick={() => onShowMore(day)}
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[12px] font-medium transition-colors hover:bg-muted",
                  isToday
                    ? "bg-primary text-primary-foreground hover:bg-primary"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground/60",
                )}
              >
                {day.getDate()}
              </button>
              <div className="flex flex-col gap-0.5">
                {visible.map((item) => (
                  <EventChip key={item.id} item={item} onOpenEvent={onOpenEvent} />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowMore(day)}
                    className="px-1.5 text-left text-[11px] font-medium text-primary hover:underline"
                  >
                    +{overflow} mais
                  </button>
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
