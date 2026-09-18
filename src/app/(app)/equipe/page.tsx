"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, UsersRound } from "lucide-react";

import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { useTeam } from "@/lib/data/team";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileDialog } from "@/components/equipe/edit-profile-dialog";

export default function EquipePage() {
  const router = useRouter();
  const { profile: currentProfile } = useCurrentActor();
  const { team, loading, error, refetch } = useTeam();
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleProfileSaved() {
    refetch();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipe"
        description="Membros da organização, funções e informações de contato."
      />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : team.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nenhum membro encontrado"
          description="Novos membros aparecem aqui assim que entram na organização."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => {
            const isSelf = member.id === currentProfile?.id;
            return (
              <Card key={member.id}>
                <CardContent className="flex items-start gap-3 pt-5">
                  <Avatar className="size-10">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-foreground">{member.name}</p>
                      {isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar meu perfil"
                          onClick={() => setEditingId(member.id)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="truncate text-[13px] text-muted-foreground">{member.email}</p>
                    <div className="mt-1">
                      {member.role ? (
                        <Badge variant="outline">{member.role.name}</Badge>
                      ) : (
                        <Badge variant="neutral">Sem função definida</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {currentProfile && editingId === currentProfile.id && (
        <EditProfileDialog
          open
          onOpenChange={(open) => !open && setEditingId(null)}
          profileId={currentProfile.id}
          currentName={currentProfile.name}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
