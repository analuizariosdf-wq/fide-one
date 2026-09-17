"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { registerSupabaseProfile } from "@/lib/mock-data/team";
import { registerSupabaseProject } from "@/lib/mock-data/projects";
import { toInitials } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import { projectInputSchema, type ProjectInput } from "@/lib/data/project-schema";
import { getCurrentOrganizationId } from "@/lib/data/organization";

export type { ProjectInput };

export interface ClientOption {
  id: string;
  name: string;
}

export interface ProfileOption {
  id: string;
  name: string;
}

export interface ProjectFilters {
  search?: string;
  clientId?: string | "todos";
  responsibleId?: string | "todos";
  status?: ProjectStatus | "todos";
}

export function filterProjects(items: Project[], filters: ProjectFilters): Project[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((project) => {
    if (search && !project.name.toLowerCase().includes(search)) return false;
    if (filters.clientId && filters.clientId !== "todos" && project.clientId !== filters.clientId) {
      return false;
    }
    if (
      filters.responsibleId &&
      filters.responsibleId !== "todos" &&
      project.responsibleId !== filters.responsibleId
    ) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && project.status !== filters.status) {
      return false;
    }
    return true;
  });
}

function mapProject(row: Tables<"projects">, campaignNameById: Map<string, string>): Project {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    campaign: row.campaign_id ? campaignNameById.get(row.campaign_id) : undefined,
    description: row.description ?? undefined,
    responsibleId: row.responsible_id ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status: row.status,
    progress: row.progress,
  };
}

interface LoadedData {
  projects: Project[];
  clients: ClientOption[];
  profiles: ProfileOption[];
}

/**
 * Same flat-queries-joined-in-JS approach as src/lib/data/clients.ts — no
 * PostgREST embedded selects (see that file for the rationale).
 */
async function loadProjectsData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();

  const [projectsRes, clientsRes, profilesRes, campaignsRes] = await Promise.all([
    supabase.from("projects").select("*").order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("id, name"),
    supabase.from("campaigns").select("id, name"),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (campaignsRes.error) throw campaignsRes.error;

  const profiles = profilesRes.data ?? [];
  for (const profile of profiles) {
    registerSupabaseProfile({
      id: profile.id,
      name: profile.name,
      initials: toInitials(profile.name),
      role: "",
    });
  }

  const campaignNameById = new Map((campaignsRes.data ?? []).map((c) => [c.id, c.name]));

  const projects = (projectsRes.data ?? []).map((row) => mapProject(row, campaignNameById));
  for (const project of projects) {
    registerSupabaseProject({ id: project.id, name: project.name });
  }

  return {
    projects,
    clients: clientsRes.data ?? [],
    profiles,
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadProjectsData();
      setProjects(data.projects);
      setClients(data.clients);
      setProfiles(data.profiles);
    } catch {
      setError("Não foi possível carregar os projetos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadProjectsData()
      .then((data) => {
        if (!active) return;
        setProjects(data.projects);
        setClients(data.clients);
        setProfiles(data.profiles);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os projetos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { projects, clients, profiles, loading, error, refetch };
}

export function useProject(id: string) {
  const { projects, clients, profiles, loading, error, refetch } = useProjects();
  return {
    project: projects.find((project) => project.id === id),
    clients,
    profiles,
    loading,
    error,
    refetch,
  };
}

/**
 * The schema models campaigns as their own table (per client), but the UI
 * still exposes "Campanha" as a free-text field (unchanged from the mock
 * version — turning it into a full picker/module is out of scope for this
 * phase). Bridges the two by finding-or-creating a campaign row scoped to
 * the project's client whenever a non-empty name is given.
 */
async function resolveCampaignId(
  clientId: string,
  organizationId: string,
  campaignName: string | undefined,
): Promise<string | null> {
  if (!campaignName) return null;

  const supabase = createSupabaseClient();

  const { data: existing, error: findError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("client_id", clientId)
    .eq("name", campaignName)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("campaigns")
    .insert({ organization_id: organizationId, client_id: clientId, name: campaignName })
    .select("id")
    .single();
  if (createError || !created) throw createError ?? new Error("Falha ao registrar a campanha.");

  return created.id;
}

function toRowPayload(input: ProjectInput, organizationId: string, campaignId: string | null) {
  return {
    organization_id: organizationId,
    client_id: input.clientId,
    campaign_id: campaignId,
    name: input.name,
    description: input.description || null,
    responsible_id: input.responsibleId,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    status: input.status,
    progress: input.progress,
  };
}

export async function createProject(rawInput: ProjectInput): Promise<Project> {
  const input = projectInputSchema.parse(rawInput);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const campaignId = await resolveCampaignId(input.clientId, organizationId, input.campaign);

  const { data, error } = await supabase
    .from("projects")
    .insert(toRowPayload(input, organizationId, campaignId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar projeto.");

  const campaignNameById = campaignId && input.campaign ? new Map([[campaignId, input.campaign]]) : new Map();
  return mapProject(data, campaignNameById);
}

export async function updateProject(id: string, rawInput: ProjectInput): Promise<Project> {
  const input = projectInputSchema.parse(rawInput);
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const campaignId = await resolveCampaignId(input.clientId, organizationId, input.campaign);

  const { data, error } = await supabase
    .from("projects")
    .update(toRowPayload(input, organizationId, campaignId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar projeto.");

  const campaignNameById = campaignId && input.campaign ? new Map([[campaignId, input.campaign]]) : new Map();
  return mapProject(data, campaignNameById);
}

export async function removeProject(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
