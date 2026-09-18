import Link from "next/link";
import { useRouter } from "next/navigation";
import { Images } from "lucide-react";

import type { Content } from "@/lib/types";
import type { ClientOption, ProfileOption } from "@/lib/data/contents";
import { contentEditorialConfig } from "@/lib/status";
import { formatDateShort } from "@/lib/format";
import { toInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  contents: Content[];
  clients: ClientOption[];
  profiles: ProfileOption[];
}

export function UpcomingContents({ contents, clients, profiles }: UpcomingContentsProps) {
  const router = useRouter();
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Próximas publicações</CardTitle>
          <CardDescription>Conteúdos com entrega nos próximos dias</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/contents">Ver todos</Link>
        </Button>
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
                const client = clientById.get(content.clientId);
                const member = profileById.get(content.responsibleId);
                const status = contentEditorialConfig[content.status];

                return (
                  <TableRow
                    key={content.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contents/${content.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {client?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">{content.title}</span>
                        <span className="text-[12px] text-muted-foreground">
                          {content.contentType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateShort(content.publishDate)}
                      {content.publishTime ? ` · ${content.publishTime}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">
                            {member ? toInitials(member.name) : ""}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          {member?.name ?? "Sem responsável"}
                        </span>
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
