"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { inviteTeamMember, type RoleOption } from "@/lib/data/team";
import { getErrorMessage } from "@/lib/error-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleOption[];
  onInvited?: () => void;
}

/** Calls the server-only /api/team/invite route — never the Admin API from the browser. */
export function InviteMemberDialog({ open, onOpenChange, roles, onInvited }: InviteMemberDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleSlug, setRoleSlug] = useState(roles[0]?.slug ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Informe nome e e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      await inviteTeamMember({ name: name.trim(), email: email.trim(), roleSlug });
      toast.success("Convite enviado por e-mail.");
      setName("");
      setEmail("");
      onInvited?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar o convite."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro</DialogTitle>
          <DialogDescription>Um e-mail de convite é enviado para a pessoa definir a própria senha.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nome" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FormField>
          <FormField label="E-mail" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Classe/função" required>
            <Select value={roleSlug} onValueChange={setRoleSlug}>
              <SelectTrigger aria-label="Classe/função">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.slug}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
