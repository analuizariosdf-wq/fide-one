"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Project, ProjectStatus } from "@/lib/types";
import { clients } from "@/lib/mock-data/clients";
import { team } from "@/lib/mock-data/users";
import { projectStatusConfig } from "@/lib/status";
import { createProject, updateProject } from "@/lib/services/projects-service";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormState {
  name: string;
  clientId: string;
  campaign: string;
  description: string;
  responsibleId: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

function emptyForm(defaultClientId?: string): FormState {
  return {
    name: "",
    clientId: defaultClientId ?? clients[0]?.id ?? "",
    campaign: "",
    description: "",
    responsibleId: team[0]?.id ?? "",
    startDate: "",
    endDate: "",
    status: "planejamento",
  };
}

function toFormState(project: Project): FormState {
  return {
    name: project.name,
    clientId: project.clientId,
    campaign: project.campaign ?? "",
    description: project.description ?? "",
    responsibleId: project.responsibleId,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
  };
}

interface ProjectFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  defaultClientId?: string;
  onSaved?: (project: Project) => void;
}

export function ProjectFormDrawer({
  open,
  onOpenChange,
  project,
  defaultClientId,
  onSaved,
}: ProjectFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() =>
    project ? toFormState(project) : emptyForm(defaultClientId),
  );
  const isEditing = Boolean(project);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.clientId || !form.startDate || !form.endDate) {
      toast.error("Preencha nome, cliente e o período do projeto.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      clientId: form.clientId,
      campaign: form.campaign.trim() || undefined,
      description: form.description.trim() || undefined,
      responsibleId: form.responsibleId,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      progress: project?.progress ?? 0,
    };

    const saved =
      isEditing && project ? updateProject(project.id, payload) : createProject(payload);

    if (saved) onSaved?.(saved);
    onOpenChange(false);
    toast.success(isEditing ? "Projeto atualizado com sucesso." : "Projeto criado com sucesso.");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{isEditing ? "Editar projeto" : "Novo projeto"}</SheetTitle>
          <SheetDescription>
            Os dados são mockados nesta etapa — nada é persistido em banco.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3">
            <FormField label="Nome" required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </FormField>

            <FormField label="Cliente" required>
              <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                <SelectTrigger aria-label="Cliente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Campanha">
              <Input value={form.campaign} onChange={(e) => update("campaign", e.target.value)} />
            </FormField>

            <FormField label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </FormField>

            <FormField label="Responsável">
              <Select value={form.responsibleId} onValueChange={(v) => update("responsibleId", v)}>
                <SelectTrigger aria-label="Responsável">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data inicial" required>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                />
              </FormField>
              <FormField label="Data final" required>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as ProjectStatus)}
              >
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectStatusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2 px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Salvar alterações" : "Criar projeto"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
