"use client";

import { Search } from "lucide-react";

import type { FinancialFilters, ClientOption } from "@/lib/data/financial";
import type { FinancialCategory } from "@/lib/types";
import { financialTransactionStatusConfig } from "@/lib/status";
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

interface FinanceiroFiltersBarProps {
  filters: FinancialFilters;
  onChange: (next: FinancialFilters) => void;
  categories: FinancialCategory[];
  clients: ClientOption[];
}

function countActive(filters: FinancialFilters) {
  return [filters.type, filters.status, filters.clientId, filters.categoryId].filter(
    (value) => value && value !== "todos",
  ).length +
    (filters.dueFrom ? 1 : 0) +
    (filters.dueTo ? 1 : 0);
}

export function FinanceiroFiltersBar({ filters, onChange, categories, clients }: FinanceiroFiltersBarProps) {
  const filterControls = (
    <>
      <Select
        value={filters.type ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, type: value as FinancialFilters["type"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Receitas e despesas</SelectItem>
          <SelectItem value="receita">Receitas</SelectItem>
          <SelectItem value="despesa">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, status: value as FinancialFilters["status"] })}
      >
        <SelectTrigger className="w-full md:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(financialTransactionStatusConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, categoryId: value as FinancialFilters["categoryId"] })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.clientId ?? "todos"}
        onValueChange={(value) => onChange({ ...filters, clientId: value as FinancialFilters["clientId"] })}
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

      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground">De</Label>
        <Input
          type="date"
          className="w-full md:w-36"
          value={filters.dueFrom ?? ""}
          onChange={(event) => onChange({ ...filters, dueFrom: event.target.value || undefined })}
        />
        <Label className="text-muted-foreground">Até</Label>
        <Input
          type="date"
          className="w-full md:w-36"
          value={filters.dueTo ?? ""}
          onChange={(event) => onChange({ ...filters, dueTo: event.target.value || undefined })}
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
            placeholder="Buscar lançamento..."
            className="pl-9"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            aria-label="Buscar lançamento"
          />
        </div>
      }
      filters={filterControls}
    />
  );
}
