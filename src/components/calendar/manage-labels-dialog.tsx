"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createLabel, removeLabel, updateLabel, type Label } from "@/lib/data/labels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManageLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: Label[];
  onChanged: () => void;
}

const DEFAULT_COLOR = "#5B3CC4";

export function ManageLabelsDialog({ open, onOpenChange, labels, onChanged }: ManageLabelsDialogProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createLabel(newName.trim(), newColor);
      setNewName("");
      onChanged();
    } catch {
      toast.error("Não foi possível criar a etiqueta.");
    }
  }

  async function handleRename(label: Label, name: string) {
    if (!name.trim() || name === label.name) return;
    try {
      await updateLabel(label.id, name.trim(), label.color);
      onChanged();
    } catch {
      toast.error("Não foi possível renomear a etiqueta.");
    }
  }

  async function handleColorChange(label: Label, color: string) {
    try {
      await updateLabel(label.id, label.name, color);
      onChanged();
    } catch {
      toast.error("Não foi possível alterar a cor.");
    }
  }

  async function handleDelete(label: Label) {
    try {
      await removeLabel(label.id);
      onChanged();
    } catch {
      toast.error("Não foi possível excluir a etiqueta.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar etiquetas</DialogTitle>
          <DialogDescription>Etiquetas pertencem à organização e podem ser usadas em qualquer conteúdo/evento.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <input
                type="color"
                value={label.color}
                onChange={(e) => handleColorChange(label, e.target.value)}
                className="size-6 shrink-0 cursor-pointer rounded border border-input"
                aria-label={`Cor da etiqueta ${label.name}`}
              />
              <Input defaultValue={label.name} className="h-8 flex-1" onBlur={(e) => handleRename(label, e.target.value)} />
              <Button variant="ghost" size="icon" aria-label={`Excluir etiqueta ${label.name}`} onClick={() => handleDelete(label)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {labels.length === 0 && <p className="text-[13px] text-muted-foreground">Nenhuma etiqueta cadastrada ainda.</p>}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="size-8 shrink-0 cursor-pointer rounded border border-input"
              aria-label="Cor da nova etiqueta"
            />
            <Input placeholder="Nova etiqueta" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="outline" onClick={handleCreate}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
