"use client";

import { Search } from "lucide-react";

import { CHANNEL_OPTIONS, CONTENT_TYPE_OPTIONS } from "@/lib/mock-data/contents";
import { clients } from "@/lib/mock-data/clients";
import { projects } from "@/lib/mock-data/projects";
import { team } from "@/lib/mock-data/users";
import { contentEditorialConfig } from "@/lib/status";
import type { ContentFilters } from "@/lib/services/contents-service";
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

interface ContentFiltersBarProps {
  filters: ContentFilters;
  onChange: (next: ContentFilters) => void;
}

function countActive(filters: ContentFilters) {
  return [
    filters.clientId,
    filters.projectId,
    filters.channel,
    filters.contentType,
    filters.responsibleId,
    filters.status,
  ].filter((value) => value && value !== "todos").length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
}

export function ContentFiltersBar({ filters, onChange }: ContentFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, clientId: value as ContentFilters["clientId"] })}
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
        onValueChange={(value) => onChange({ ...filters, projectId: value as ContentFilters["projectId"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Projeto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os projetos</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.channel ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, channel: value as ContentFilters["channel"] })}
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
          onChange({ ...filters, contentType: value as ContentFilters["contentType"] })
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
          onChange({ ...filters, responsibleId: value as ContentFilters["responsibleId"] })
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
        onValueChange={(value) => onChange({ ...filters, status: value as ContentFilters["status"] })}
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
    </>
  );

  return (
    <FilterBar
      activeCount={countActive(filters)}
      search={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conteúdo..."
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            aria-label="Buscar conteúdo"
          />
        </div>
      }
      filters={filterControls}
    />
  );
}
