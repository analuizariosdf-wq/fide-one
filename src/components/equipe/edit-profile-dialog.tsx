"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateOwnProfile } from "@/lib/data/team";
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

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  currentName: string;
  onSaved?: () => void;
}

/**
 * Only `name` is editable — RLS ("profiles_update_self") only lets a user
 * touch their own row, and the app additionally keeps role/e-mail out of
 * this form on purpose (see src/lib/data/team.ts).
 */
export function EditProfileDialog({ open, onOpenChange, profileId, currentName, onSaved }: EditProfileDialogProps) {
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await updateOwnProfile(profileId, name);
      toast.success("Perfil atualizado.");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar meu perfil</DialogTitle>
          <DialogDescription>Apenas o seu próprio perfil pode ser editado por aqui.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nome" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
