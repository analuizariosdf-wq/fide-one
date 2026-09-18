"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Tags } from "lucide-react";

import type { CalendarItem, Content } from "@/lib/types";
import { useCalendarItems, type CalendarFilters } from "@/lib/services/calendar-service";
import { useTasks } from "@/lib/data/tasks";
import { useLabels } from "@/lib/data/labels";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
} from "@/lib/calendar-utils";
import { MOCK_TODAY, toISODate } from "@/lib/format";
import { useHasPermission } from "@/lib/auth/current-actor-context";
import { RequirePermission } from "@/components/shared/require-permission";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarFiltersBar } from "@/components/calendar/calendar-filters";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { ListView } from "@/components/calendar/list-view";
import { EventDetailDialog } from "@/components/calendar/event-detail-dialog";
import { EventFormDrawer } from "@/components/calendar/event-form-drawer";
import { ManageLabelsDialog } from "@/components/calendar/manage-labels-dialog";
import { ContentFormDrawer } from "@/components/contents/content-form-drawer";

type CalendarView = "mes" | "semana" | "lista";

export default function CalendarPage() {
  return (
    <RequirePermission permission="calendar.view">
      <CalendarContent />
    </RequirePermission>
  );
}

function CalendarContent() {
  const canManage = useHasPermission("calendar.manage");
  const [view, setView] = useState<CalendarView>("mes");
  const [referenceDate, setReferenceDate] = useState<Date>(MOCK_TODAY);
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [openEvent, setOpenEvent] = useState<CalendarItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [contentDrawerOpen, setContentDrawerOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>(undefined);

  const { items, clients, projects, profiles, loading, error, refetch } = useCalendarItems(filters);
  const { tasks } = useTasks();
  const { labels, refetch: refetchLabels } = useLabels();

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

  function handleQuickAdd(day: Date) {
    setQuickAddDate(toISODate(day));
    setContentDrawerOpen(true);
  }

  function handleContentSaved(content: Content) {
    refetch();
    // Jump straight to the new publication's day so the user sees it land.
    setReferenceDate(new Date(`${content.publishDate}T00:00:00`));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Visualize publicações, tarefas, reuniões e prazos da operação."
        action={
          canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setLabelsOpen(true)}>
                <Tags className="size-4" />
                Gerenciar etiquetas
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Novo evento
              </Button>
            </div>
          )
        }
      />

      <CalendarFiltersBar filters={filters} onChange={setFilters} clients={clients} projects={projects} profiles={profiles} />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : (
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

          {loading ? (
            <Skeleton className="mt-4 h-96 w-full" />
          ) : (
            <>
              <TabsContent value="mes" className="pt-4">
                <MonthView
                  referenceDate={referenceDate}
                  items={items}
                  onOpenEvent={setOpenEvent}
                  onShowMore={(day) => {
                    setReferenceDate(day);
                    setView("lista");
                  }}
                  onQuickAdd={canManage ? handleQuickAdd : undefined}
                />
              </TabsContent>

              <TabsContent value="semana" className="pt-4">
                <WeekView referenceDate={referenceDate} items={items} onOpenEvent={setOpenEvent} />
              </TabsContent>

              <TabsContent value="lista" className="pt-4">
                <ListView referenceDate={referenceDate} items={items} onOpenEvent={setOpenEvent} />
              </TabsContent>
            </>
          )}
        </Tabs>
      )}

      <EventDetailDialog
        item={openEvent}
        onOpenChange={(open) => !open && setOpenEvent(null)}
        clients={clients}
        projects={projects}
        onChanged={refetch}
      />

      <EventFormDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        projects={projects}
        onSaved={refetch}
      />

      <ManageLabelsDialog open={labelsOpen} onOpenChange={setLabelsOpen} labels={labels} onChanged={refetchLabels} />

      {contentDrawerOpen && (
        <ContentFormDrawer
          open={contentDrawerOpen}
          onOpenChange={setContentDrawerOpen}
          clients={clients}
          projects={projects}
          profiles={profiles}
          tasks={tasks}
          defaultPublishDate={quickAddDate}
          onSaved={handleContentSaved}
        />
      )}
    </div>
  );
}
