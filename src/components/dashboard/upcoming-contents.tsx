import type { Client, ContentItem, TeamMember } from "@/lib/types";
import { contentStatusConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Images } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface UpcomingContentsProps {
  contents: ContentItem[];
  getClient: (id: string) => Client | undefined;
  getMember: (id: string) => TeamMember | undefined;
}

export function UpcomingContents({
  contents,
  getClient,
  getMember,
}: UpcomingContentsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Próximas publicações</CardTitle>
          <CardDescription>Conteúdos com entrega nos próximos dias</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {contents.length === 0 ? (
          <EmptyState icon={Images} title="Nenhuma publicação agendada" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => {
                const client = getClient(content.clientId);
                const member = getMember(content.responsibleId);
                const status = contentStatusConfig[content.status];

                return (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium text-foreground">
                      {client?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">{content.title}</span>
                        <span className="text-[12px] text-muted-foreground">
                          {content.format}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {content.dueLabel}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">
                            {member?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{member?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
