import { CalendarX2 } from "lucide-react";

import type { CalendarItem } from "@/lib/types";
import { formatDateLong } from "@/lib/format";
import { isSameMonth } from "@/lib/calendar-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { EventChip } from "@/components/calendar/event-chip";

interface ListViewProps {
  referenceDate: Date;
  items: CalendarItem[];
  onOpenEvent: (item: CalendarItem) => void;
}

export function ListView({ referenceDate, items, onOpenEvent }: ListViewProps) {
  const monthItems = items
    .filter((item) => isSameMonth(new Date(`${item.date}T00:00:00`), referenceDate))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));

  if (monthItems.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Nada agendado neste mês"
        description="Ajuste os filtros ou navegue para outro período."
      />
    );
  }

  const groups = new Map<string, CalendarItem[]>();
  for (const item of monthItems) {
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {Array.from(groups.entries()).map(([date, dateItems]) => (
        <div key={date} className="flex flex-col gap-2 p-3 sm:flex-row sm:gap-4">
          <span className="shrink-0 text-[13px] font-medium text-foreground sm:w-44">
            {formatDateLong(new Date(`${date}T00:00:00`))}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            {dateItems.map((item) => (
              <EventChip key={item.id} item={item} onOpenEvent={onOpenEvent} className="px-2" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
