export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateLong(date: Date): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Reference "today" for the mock dataset. The demo content (due dates,
 * project periods) is written around this date so labels like "Hoje"
 * stay correct regardless of the real calendar date.
 */
export const MOCK_TODAY = new Date(2026, 8, 15);

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateShort(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

export function getDueLabel(
  dateISO: string,
  reference: Date = MOCK_TODAY,
): string {
  const due = startOfDay(new Date(`${dateISO}T00:00:00`));
  const ref = startOfDay(reference);
  const diffDays = Math.round((due.getTime() - ref.getTime()) / 86_400_000);

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays === -1) return "Ontem";
  if (diffDays < 0) return `Atrasado · ${formatDateShort(dateISO)}`;
  return formatDateShort(dateISO);
}

export function isOverdue(
  dateISO: string,
  reference: Date = MOCK_TODAY,
): boolean {
  const due = startOfDay(new Date(`${dateISO}T00:00:00`));
  return due.getTime() < startOfDay(reference).getTime();
}

/**
 * Same as `getDueLabel`, but never renders the "Atrasado" phrasing for a
 * task that's already done — a completed task isn't "late", whatever its
 * due date was.
 */
export function getTaskDueLabel(dateISO: string, isDone: boolean): string {
  return isDone ? formatDateShort(dateISO) : getDueLabel(dateISO);
}
