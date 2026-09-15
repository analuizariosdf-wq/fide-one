import type { CalendarEvent } from "@/lib/types";

/**
 * Standalone calendar entries — meetings, generic events and explicit
 * deadlines that aren't a Content publication or a Task due date. No
 * dedicated module backs these yet (out of scope for this etapa); they
 * exist so the calendar can visually represent the full operational
 * picture, per the "calendário editorial + operacional" requirement.
 */
export const calendarEvents: CalendarEvent[] = [
  {
    id: "event-1",
    title: "Reunião de alinhamento — Inovar RH",
    type: "reuniao",
    date: "2026-09-15",
    time: "10:00",
    clientId: "inovar",
    description: "Alinhamento mensal com o time de RH da Inovar sobre o calendário editorial.",
  },
  {
    id: "event-2",
    title: "Deadline — Fechamento de pauta Outubro",
    type: "deadline",
    date: "2026-09-25",
    clientId: null,
    description: "Prazo final para fechar a pauta de conteúdo de outubro com todos os clientes.",
  },
  {
    id: "event-3",
    title: "Reunião de apresentação — Grupo Almeida",
    type: "reuniao",
    date: "2026-09-18",
    time: "14:30",
    clientId: "grupo-almeida",
    description: "Apresentação da proposta de rebranding para retomada do contrato.",
  },
  {
    id: "event-4",
    title: "Evento — Workshop interno de conteúdo",
    type: "evento",
    date: "2026-09-22",
    time: "09:30",
    clientId: null,
    description: "Workshop interno da equipe sobre novos formatos de conteúdo em vídeo.",
  },
  {
    id: "event-5",
    title: "Deadline — Renovação de contrato Pleno",
    type: "deadline",
    date: "2026-09-30",
    clientId: "pleno",
    description: "Prazo para envio da proposta de renovação do contrato do Pleno Hospital Dia.",
  },
];

export function getCalendarEvent(id: string): CalendarEvent | undefined {
  return calendarEvents.find((event) => event.id === id);
}
