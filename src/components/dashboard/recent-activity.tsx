import { Activity } from "lucide-react";

import type { ActivityItem, TeamMember } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

interface RecentActivityProps {
  activity: ActivityItem[];
  getMember: (id: string) => TeamMember | undefined;
}

export function RecentActivity({ activity, getMember }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activity.length === 0 ? (
          <EmptyState icon={Activity} title="Nenhuma atividade recente" />
        ) : (
          activity.map((item) => {
            const actor = getMember(item.actorId);

            return (
              <div key={item.id} className="flex items-start gap-2.5">
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-[11px]">
                    {actor?.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-[13px] text-foreground">
                    <span className="font-medium">{actor?.name}</span>{" "}
                    {item.description}
                  </p>
                  <span className="text-[12px] text-muted-foreground">
                    {item.timeLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
