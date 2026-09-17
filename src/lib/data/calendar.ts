"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { toHoursMinutes } from "@/lib/format";
import type { CalendarEvent, CalendarEventType, CalendarItem, CalendarItemKind } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import { calendarEventInputSchema, type CalendarEventInput } from "@/lib/data/calendar-schema";
import { getCurrentOrganizationId } from "@/lib/data/organization";

export type { CalendarEventInput };

type DbEventType = Tables<"calendar_events">["type"];

/**
 * The schema's CHECK constraint has 5 values, but this app only ever
 * *writes* 3 of them going forward — "publication"/"task" are legacy
 * (calendar_events.task_id/content_id let an event point at an existing
 * task/content instead of duplicating it, but Tasks/Contents are now real
 * sources aggregated directly by due_date/scheduled_date, so creating a
 * "task"/"publication" calendar_event today would just be a duplicate).
 * Reading still maps all 5 so an old row never breaks the aggregator —
 * see DB_TYPE_TO_KIND — but only meeting/event/deadline round-trip back
 * into an editable CalendarEvent (DB_TYPE_TO_EVENT_TYPE returns undefined
 * for the other two, so the detail dialog's Edit/Delete stay hidden).
 */
const EVENT_TYPE_TO_DB: Record<CalendarEventType, DbEventType> = {
  reuniao: "meeting",
  evento: "event",
  deadline: "deadline",
};

const DB_TYPE_TO_EVENT_TYPE: Partial<Record<DbEventType, CalendarEventType>> = {
  meeting: "reuniao",
  event: "evento",
  deadline: "deadline",
};

const DB_TYPE_TO_KIND: Record<DbEventType, CalendarItemKind> = {
  meeting: "reuniao",
  event: "evento",
  deadline: "deadline",
  publication: "publicacao",
  task: "tarefa",
};

function mapRowToCalendarItem(row: Tables<"calendar_events">): CalendarItem {
  const eventType = DB_TYPE_TO_EVENT_TYPE[row.type];
  const time = toHoursMinutes(row.event_time);
  const sourceEvent: CalendarEvent | undefined = eventType
    ? {
        id: row.id,
        title: row.title,
        type: eventType,
        date: row.event_date,
        time,
        clientId: row.client_id,
        projectId: row.project_id,
        description: row.description ?? undefined,
      }
    : undefined;

  return {
    id: `calendar-event-${row.id}`,
    kind: DB_TYPE_TO_KIND[row.type],
    title: row.title,
    date: row.event_date,
    time,
    clientId: row.client_id,
    projectId: row.project_id,
    sourceEvent,
  };
}

async function loadCalendarEvents(): Promise<CalendarItem[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("calendar_events").select("*").order("event_date");
  if (error) throw error;
  return (data ?? []).map(mapRowToCalendarItem);
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await loadCalendarEvents());
    } catch {
      setError("Não foi possível carregar os eventos do calendário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadCalendarEvents()
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os eventos do calendário. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { events, loading, error, refetch };
}

/** Same reasoning as the equivalent asserts in tasks.ts/contents.ts. */
async function assertClientBelongsToOrg(clientId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente inválido para esta organização.");
}

async function assertProjectBelongsToOrg(projectId: string, clientId: string | null): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Projeto inválido para esta organização.");
  if (clientId && data.client_id !== clientId) {
    throw new Error("O projeto selecionado não pertence ao cliente informado.");
  }
}

async function assertRelationships(input: CalendarEventInput): Promise<void> {
  if (input.clientId) await assertClientBelongsToOrg(input.clientId);
  if (input.projectId) await assertProjectBelongsToOrg(input.projectId, input.clientId);
}

function toRowPayload(input: CalendarEventInput, organizationId: string) {
  return {
    organization_id: organizationId,
    title: input.title,
    type: EVENT_TYPE_TO_DB[input.type],
    event_date: input.date,
    event_time: input.time || null,
    client_id: input.clientId,
    project_id: input.projectId,
    description: input.description || null,
  };
}

export async function createCalendarEvent(rawInput: CalendarEventInput): Promise<CalendarItem> {
  const input = calendarEventInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("calendar_events")
    .insert(toRowPayload(input, organizationId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar evento.");

  return mapRowToCalendarItem(data);
}

export async function updateCalendarEvent(id: string, rawInput: CalendarEventInput): Promise<CalendarItem> {
  const input = calendarEventInputSchema.parse(rawInput);
  await assertRelationships(input);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("calendar_events")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar evento.");

  return mapRowToCalendarItem(data);
}

export async function removeCalendarEvent(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}
