"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { toInitials } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditProfileDialog } from "@/components/equipe/edit-profile-dialog";

/**
 * Only what's real and simple: organization info (read-only — editing it
 * is admin-only per RLS and not part of this MVP) and the user's own
 * profile (reusing the same edit flow as Equipe). No preferences exist in
 * the schema yet, so none are fabricated here.
 */
export default function ConfiguracoesPage() {
  const router = useRouter();
  const { organization, profile, role } = useCurrentActor();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Informações da organização e do seu perfil." />

      <Card>
        <CardHeader>
          <CardTitle>Organização</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground">Nome</span>
            <span className="text-[14px] text-foreground">{organization?.name ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground">Identificador</span>
            <span className="text-[14px] text-foreground">{organization?.slug ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{profile ? toInitials(profile.name) : "—"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-foreground">{profile?.name ?? "—"}</span>
            <span className="text-[13px] text-muted-foreground">{profile?.email ?? "—"}</span>
            {role && <Badge variant="outline">{role.name}</Badge>}
          </div>
        </CardContent>
      </Card>

      {profile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profileId={profile.id}
          currentName={profile.name}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
