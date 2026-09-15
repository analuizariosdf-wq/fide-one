"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CalendarItem } from "@/lib/types";
import { useCalendarItems, type CalendarFilters } from "@/lib/services/calendar-service";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
} from "@/lib/calendar-utils";
import { MOCK_TODAY } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarFiltersBar } from "@/components/calendar/calendar-filters";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { ListView } from "@/components/calendar/list-view";
import { EventDetailDialog } from "@/components/calendar/event-detail-dialog";

type CalendarView = "mes" | "semana" | "lista";

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("mes");
  const [referenceDate, setReferenceDate] = useState<Date>(MOCK_TODAY);
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [openEvent, setOpenEvent] = useState<CalendarItem | null>(null);

  const items = useCalendarItems(filters);

  const periodLabel = useMemo(() => {
    if (view === "semana") return formatWeekRangeLabel(referenceDate);
    return formatMonthLabel(referenceDate);
  }, [view, referenceDate]);

  function goPrev() {
    setReferenceDate((current) =>
      view === "semana" ? addDays(current, -7) : addMonths(current, -1),
    );
  }

  function goNext() {
    setReferenceDate((current) =>
      view === "semana" ? addDays(current, 7) : addMonths(current, 1),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Visualize publicações, tarefas, reuniões e prazos da operação."
      />

      <CalendarFiltersBar filters={filters} onChange={setFilters} />

      <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Período anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-[13px] font-medium text-foreground">
              {periodLabel}
            </span>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Próximo período">
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReferenceDate(MOCK_TODAY)}>
              Hoje
            </Button>
          </div>
        </div>

        <TabsContent value="mes" className="pt-4">
          <MonthView
            referenceDate={referenceDate}
            items={items}
            onOpenEvent={setOpenEvent}
            onShowMore={(day) => {
              setReferenceDate(day);
              setView("lista");
            }}
          />
        </TabsContent>

        <TabsContent value="semana" className="pt-4">
          <WeekView referenceDate={referenceDate} items={items} onOpenEvent={setOpenEvent} />
        </TabsContent>

        <TabsContent value="lista" className="pt-4">
          <ListView referenceDate={referenceDate} items={items} onOpenEvent={setOpenEvent} />
        </TabsContent>
      </Tabs>

      <EventDetailDialog item={openEvent} onOpenChange={(open) => !open && setOpenEvent(null)} />
    </div>
  );
}
