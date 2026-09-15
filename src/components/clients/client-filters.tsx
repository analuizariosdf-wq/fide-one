"use client";

import { Search } from "lucide-react";

import { clientStatusConfig } from "@/lib/status";
import type { ClientFilters, ProfileOption, ServiceOption } from "@/lib/data/clients";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/filter-bar";

interface ClientFiltersBarProps {
  filters: ClientFilters;
  onChange: (next: ClientFilters) => void;
  profiles: ProfileOption[];
  services: ServiceOption[];
}

function countActive(filters: ClientFilters) {
  return [filters.status, filters.responsibleId, filters.service].filter(
    (value) => value && value !== "todos",
  ).length;
}

export function ClientFiltersBar({ filters, onChange, profiles, services }: ClientFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.status ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, status: value as ClientFilters["status"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(clientStatusConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.responsibleId ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, responsibleId: value as ClientFilters["responsibleId"] })
        }
      >
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os responsáveis</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.service ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, service: value as ClientFilters["service"] })}
      >
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="Serviço" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os serviços</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.name}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <FilterBar
      activeCount={countActive(filters)}
      search={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            aria-label="Buscar cliente"
          />
        </div>
      }
      filters={filterControls}
    />
  );
}
