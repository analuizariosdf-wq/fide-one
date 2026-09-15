import { getDashboardData } from "@/lib/services/dashboard-service";
import { getClient } from "@/lib/mock-data/clients";
import { getTeamMember } from "@/lib/mock-data/team";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { AttentionSection } from "@/components/dashboard/attention-section";
import { UpcomingContents } from "@/components/dashboard/upcoming-contents";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreeting name={data.user.name} />

      <KpiCards stats={data.stats} />

      <AttentionSection items={data.attention} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingContents
            contents={data.upcomingContents}
            getClient={getClient}
            getMember={getTeamMember}
          />
        </div>
        <div className="flex flex-col gap-4">
          <MyTasks tasks={data.myTasks} getClient={getClient} />
          <RecentActivity
            activity={data.recentActivity}
            getMember={getTeamMember}
          />
        </div>
      </div>
    </div>
  );
}
