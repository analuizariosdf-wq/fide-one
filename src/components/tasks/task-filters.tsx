"use client";

import { Search } from "lucide-react";

import { clients } from "@/lib/mock-data/clients";
import { projects } from "@/lib/mock-data/projects";
import { team } from "@/lib/mock-data/users";
import { taskUrgencyConfig, taskWorkflowConfig } from "@/lib/status";
import type { TaskFilters } from "@/lib/services/tasks-service";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/filter-bar";

interface TaskFiltersBarProps {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
}

function countActive(filters: TaskFilters) {
  return [
    filters.clientId,
    filters.projectId,
    filters.assigneeId,
    filters.status,
    filters.priority,
    filters.due && filters.due !== "todas" ? filters.due : undefined,
  ].filter((value) => value && value !== "todos").length;
}

export function TaskFiltersBar({ filters, onChange }: TaskFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, clientId: value as TaskFilters["clientId"] })}
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
        onValueChange={(value) => onChange({ ...filters, projectId: value as TaskFilters["projectId"] })}
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
        value={filters.assigneeId ?? "todos"}
        onValueChange={(value) =>
          onChange({ ...filters, assigneeId: value as TaskFilters["assigneeId"] })
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
        onValueChange={(value) => onChange({ ...filters, status: value as TaskFilters["status"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(taskWorkflowConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, priority: value as TaskFilters["priority"] })}
      >
        <SelectTrigger className="w-full md:w-32">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas</SelectItem>
          {Object.entries(taskUrgencyConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.due ?? "todas"}
        onValueChange={(value) => onChange({ ...filters, due: value as TaskFilters["due"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Prazo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Qualquer prazo</SelectItem>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="semana">Esta semana</SelectItem>
          <SelectItem value="atrasadas">Atrasadas</SelectItem>
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
            placeholder="Buscar tarefa..."
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            aria-label="Buscar tarefa"
          />
        </div>
      }
      filters={filterControls}
    />
  );
}
