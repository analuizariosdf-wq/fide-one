"use client";

import Link from "next/link";

import type { CalendarItem } from "@/lib/types";
import { calendarItemKindConfig } from "@/lib/status";
import { cn } from "@/lib/utils";

interface EventChipProps {
  item: CalendarItem;
  onOpenEvent: (item: CalendarItem) => void;
  className?: string;
}

export function EventChip({ item, onOpenEvent, className }: EventChipProps) {
  const meta = calendarItemKindConfig[item.kind];

  const content = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClass)} aria-hidden />
      {item.time && <span className="shrink-0 text-muted-foreground">{item.time}</span>}
      <span className="truncate">{item.title}</span>
    </span>
  );

  const sharedClassName = cn(
    "block w-full rounded px-1.5 py-1 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-muted",
    className,
  );

  if (item.href) {
    return (
      <Link href={item.href} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onOpenEvent(item)} className={sharedClassName}>
      {content}
    </button>
  );
}
