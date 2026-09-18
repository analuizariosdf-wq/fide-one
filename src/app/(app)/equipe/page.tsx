"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, ShieldOff, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { useCurrentActor, useHasPermission } from "@/lib/auth/current-actor-context";
import { useTeam, updateMemberRole, setMemberAccess, type TeamProfile } from "@/lib/data/team";
import { getErrorMessage } from "@/lib/error-message";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditProfileDialog } from "@/components/equipe/edit-profile-dialog";
import { InviteMemberDialog } from "@/components/equipe/invite-member-dialog";

export default function EquipePage() {
  const router = useRouter();
  const { profile: currentProfile } = useCurrentActor();
  const canManageTeam = useHasPermission("team.manage");
  const { team, roles, loading, error, refetch } = useTeam();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingAccessChange, setPendingAccessChange] = useState<string | null>(null);

  function handleProfileSaved() {
    refetch();
    router.refresh();
  }

  async function handleRoleChange(member: TeamProfile, roleId: string) {
    try {
      await updateMemberRole(member.id, roleId);
      toast.success("Função atualizada.");
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a função."));
    }
  }

  async function handleAccessToggle(member: TeamProfile) {
    setPendingAccessChange(member.id);
    try {
      await setMemberAccess(member.id, member.deactivatedAt ? "reactivate" : "deactivate");
      toast.success(member.deactivatedAt ? "Acesso reativado." : "Acesso desativado.");
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o acesso."));
    } finally {
      setPendingAccessChange(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipe"
        description="Membros da organização, funções e controle de acesso."
        action={
          canManageTeam && (
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="size-4" />
              Adicionar membro
            </Button>
          )
        }
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
            const isDeactivated = Boolean(member.deactivatedAt);

            return (
              <Card key={member.id} className={isDeactivated ? "opacity-60" : undefined}>
                <CardContent className="flex items-start gap-3 pt-5">
                  <Avatar className="size-10">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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

                    {canManageTeam && !isSelf ? (
                      <Select value={member.role?.id ?? ""} onValueChange={(value) => handleRoleChange(member, value)}>
                        <SelectTrigger className="h-8" aria-label={`Função de ${member.name}`}>
                          <SelectValue placeholder="Sem função" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : member.role ? (
                      <Badge variant="outline" className="w-fit">
                        {member.role.name}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="w-fit">
                        Sem função definida
                      </Badge>
                    )}

                    {isDeactivated && (
                      <Badge variant="danger" className="w-fit">
                        Acesso desativado
                      </Badge>
                    )}

                    {canManageTeam && !isSelf && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 w-fit"
                        disabled={pendingAccessChange === member.id}
                        onClick={() => handleAccessToggle(member)}
                      >
                        {isDeactivated ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
                        {isDeactivated ? "Reativar acesso" : "Desativar acesso"}
                      </Button>
                    )}
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

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles} onInvited={refetch} />
    </div>
  );
}
