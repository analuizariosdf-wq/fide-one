"use client";

import { Search } from "lucide-react";

import { clients } from "@/lib/mock-data/clients";
import { team } from "@/lib/mock-data/users";
import { projectStatusConfig } from "@/lib/status";
import type { ProjectFilters } from "@/lib/services/projects-service";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/filter-bar";

interface ProjectFiltersBarProps {
  filters: ProjectFilters;
  onChange: (next: ProjectFilters) => void;
}

function countActive(filters: ProjectFilters) {
  return [filters.clientId, filters.responsibleId, filters.status].filter(
    (value) => value && value !== "todos",
  ).length;
}

export function ProjectFiltersBar({ filters, onChange }: ProjectFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, clientId: value as ProjectFilters["clientId"] })}
      >
        <SelectTrigger className="w-full md:w-44">
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
        value={filters.responsibleId ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, responsibleId: value as ProjectFilters["responsibleId"] })
        }
      >
        <SelectTrigger className="w-full md:w-44">
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
        onValueChange={(value) => onChange({ ...filters, status: value as ProjectFilters["status"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(projectStatusConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
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
            placeholder="Buscar projeto..."
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            aria-label="Buscar projeto"
          />
        </div>
      }
      filters={filterControls}
    />
  );
}
