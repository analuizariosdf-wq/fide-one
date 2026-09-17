"use client";

import type { ReportFilters } from "@/lib/data/reports";
import type { ClientOption } from "@/lib/data/tasks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/filter-bar";

interface RelatoriosFiltersBarProps {
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  clients: ClientOption[];
  projects: { id: string; name: string; clientId: string }[];
  profiles: { id: string; name: string }[];
}

function countActive(filters: ReportFilters) {
  return [filters.clientId, filters.projectId, filters.responsibleId].filter(
    (value) => value && value !== "todos",
  ).length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
}

export function RelatoriosFiltersBar({ filters, onChange, clients, projects, profiles }: RelatoriosFiltersBarProps) {
  const availableProjects =
    filters.clientId && filters.clientId !== "todos"
      ? projects.filter((project) => project.clientId === filters.clientId)
      : projects;

  const filterControls = (
    <>
      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground">De</Label>
        <Input
          type="date"
          className="w-full md:w-36"
          value={filters.dateFrom ?? ""}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
        />
        <Label className="text-muted-foreground">Até</Label>
        <Input
          type="date"
          className="w-full md:w-36"
          value={filters.dateTo ?? ""}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
        />
      </div>

      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, clientId: value as ReportFilters["clientId"], projectId: "todos" })
        }
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
        value={filters.projectId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, projectId: value as ReportFilters["projectId"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Projeto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os projetos</SelectItem>
          {availableProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.responsibleId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, responsibleId: value as ReportFilters["responsibleId"] })}
      >
        <SelectTrigger className="w-full md:w-40">
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
    </>
  );

  return <FilterBar activeCount={countActive(filters)} filters={filterControls} />;
}
