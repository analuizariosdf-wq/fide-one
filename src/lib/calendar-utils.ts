import { toISODate } from "@/lib/format";

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayIndex(date: Date): number {
  // getDay(): 0=Sun..6=Sat → convert to Monday-first index (0=Mon..6=Sun)
  return (date.getDay() + 6) % 7;
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -mondayIndex(date));
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 6 full weeks (42 days), Monday-first, covering the reference month. */
export function getMonthGridDays(date: Date): Date[] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatWeekRangeLabel(date: Date): string {
  const days = getWeekDays(date);
  const first = days[0];
  const last = days[6];
  const sameMonth = isSameMonth(first, last);
  const format = (d: Date, withMonth: boolean) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: withMonth ? "short" : undefined,
    }).format(d);

  return `${format(first, !sameMonth)} — ${format(last, true)}`;
}

export function formatDayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
