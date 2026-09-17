"use client";

import { useDashboardData } from "@/lib/services/dashboard-service";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { AttentionSection } from "@/components/dashboard/attention-section";
import { UpcomingContents } from "@/components/dashboard/upcoming-contents";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const data = useDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreeting name={data.userName} />

      {data.error ? (
        <ErrorState description={data.error} onRetry={data.refetch} />
      ) : data.loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <KpiCards
            tasksValue={data.kpis.tasksValue}
            tasksHelper={data.kpis.tasksHelper}
            tasksOverdue={data.kpis.tasksOverdue}
            contentsValue={data.kpis.contentsValue}
            contentsHelper={data.kpis.contentsHelper}
          />

          {data.attentionItems.length > 0 && <AttentionSection items={data.attentionItems} />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UpcomingContents
                contents={data.upcomingContents}
                clients={data.contentClients}
                profiles={data.contentProfiles}
              />
            </div>
            <div className="flex flex-col gap-4">
              <MyTasks tasks={data.myTasks} clients={data.taskClients} />
              <RecentActivity />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
