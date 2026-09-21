"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";

import { useCurrentActor, useHasPermission } from "@/lib/auth/current-actor-context";
import { toInitials } from "@/lib/utils";
import { updateOrganizationBranding, uploadOrganizationImage } from "@/lib/data/branding";
import { sendTestEmail } from "@/lib/data/notifications-admin";
import { getErrorMessage } from "@/lib/error-message";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditProfileDialog } from "@/components/equipe/edit-profile-dialog";

/**
 * Organization info is read-only display + the "Personalização" form
 * (settings.manage only); the user's own profile reuses the same edit
 * flow as Equipe. No preferences beyond branding exist in the schema, so
 * none are fabricated here.
 */
export default function ConfiguracoesPage() {
  const router = useRouter();
  const { organization, profile, role } = useCurrentActor();
  const canManageSettings = useHasPermission("settings.manage");
  const [editOpen, setEditOpen] = useState(false);

  const [displayName, setDisplayName] = useState(organization?.displayName ?? "");
  const [accentColor, setAccentColor] = useState(organization?.accentColor ?? "#5b3cc4");
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [testEmail, setTestEmail] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  async function handleSaveBranding() {
    if (!organization) return;
    setSavingBranding(true);
    try {
      await updateOrganizationBranding(organization.id, { displayName: displayName.trim() || null, accentColor });
      toast.success("Personalização atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a personalização."));
    } finally {
      setSavingBranding(false);
    }
  }

  async function handleImageUpload(kind: "logo" | "favicon", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      await uploadOrganizationImage(kind, file);
      toast.success(kind === "logo" ? "Logo atualizado." : "Favicon atualizado.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar a imagem."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSendTestEmail(event: FormEvent) {
    event.preventDefault();
    if (!testEmail.trim()) return;
    setSendingTestEmail(true);
    try {
      await sendTestEmail(testEmail.trim());
      toast.success(`E-mail de teste enviado para ${testEmail.trim()}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar o e-mail de teste."));
    } finally {
      setSendingTestEmail(false);
    }
  }

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

      {canManageSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Personalização</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-[13px] text-muted-foreground">
              Identidade visual exibida na sidebar, no cabeçalho e nos títulos do sistema. Deixe em
              branco para usar o padrão do FIDE ONE.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="displayName">Nome exibido do sistema</Label>
                <Input
                  id="displayName"
                  placeholder="FIDE ONE"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="accentColor">Cor principal</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="accentColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-surface p-1"
                  />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 rounded-md">
                    {organization?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={organization.logoUrl} alt="Logo" className="size-full rounded-md object-cover" />
                    ) : (
                      <AvatarFallback className="rounded-md">
                        {(organization?.displayName || organization?.name || "F").charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {uploadingLogo ? "Enviando..." : "Enviar logo"}
                  </Button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload("logo", e)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Favicon</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 rounded-md">
                    {organization?.faviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={organization.faviconUrl} alt="Favicon" className="size-full rounded-md object-cover" />
                    ) : (
                      <AvatarFallback className="rounded-md">—</AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingFavicon}
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {uploadingFavicon ? "Enviando..." : "Enviar favicon"}
                  </Button>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload("favicon", e)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Button onClick={handleSaveBranding} disabled={savingBranding}>
                {savingBranding ? "Salvando..." : "Salvar personalização"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageSettings && (
        <Card>
          <CardHeader>
            <CardTitle>E-mail / Notificações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Envie um e-mail de teste para confirmar que a integração com o Resend (usada nos
              lembretes de tarefa) está funcionando, sem precisar esperar o envio automático.
            </p>
            <form onSubmit={handleSendTestEmail} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="testEmail">E-mail de teste</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={sendingTestEmail}>
                <Mail className="size-4" />
                {sendingTestEmail ? "Enviando..." : "Enviar e-mail de teste"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
