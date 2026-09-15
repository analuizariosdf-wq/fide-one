"use client";

import { CHANNEL_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/lib/mock-data/contents";
import { clients } from "@/lib/mock-data/clients";
import { team } from "@/lib/mock-data/users";
import { calendarItemKindConfig, contentEditorialConfig } from "@/lib/status";
import type { CalendarFilters } from "@/lib/services/calendar-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/filter-bar";

interface CalendarFiltersBarProps {
  filters: CalendarFilters;
  onChange: (next: CalendarFilters) => void;
}

function countActive(filters: CalendarFilters) {
  return Object.values(filters).filter((value) => value && value !== "todos").length;
}

export function CalendarFiltersBar({ filters, onChange }: CalendarFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, clientId: value as CalendarFilters["clientId"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os clientes</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.channel ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, channel: value as CalendarFilters["channel"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os canais</SelectItem>
          {CHANNEL_OPTIONS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.contentType ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, contentType: value as CalendarFilters["contentType"] })
        }
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os formatos</SelectItem>
          {CONTENT_TYPE_OPTIONS.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.responsibleId ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, responsibleId: value as CalendarFilters["responsibleId"] })
        }
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os responsáveis</SelectItem>
          {team.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, status: value as CalendarFilters["status"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(contentEditorialConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.kind ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, kind: value as CalendarFilters["kind"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Tipo de evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {Object.entries(calendarItemKindConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return <FilterBar activeCount={countActive(filters)} filters={filterControls} />;
}
