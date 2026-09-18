"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export interface Pipeline {
  id: string;
  name: string;
  position: number;
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Lead {
  id: string;
  pipelineId: string;
  stageId: string;
  name: string;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  responsibleId: string | null;
  source: string | null;
  serviceId: string | null;
  expectedValue: number | null;
  entryDate: string;
  expectedCloseDate: string | null;
  notes: string | null;
  status: "aberto" | "ganho" | "perdido";
  lostReason: string | null;
}

export interface LeadInput {
  pipelineId: string;
  stageId: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  responsibleId?: string | null;
  source?: string | null;
  serviceId?: string | null;
  expectedValue?: number | null;
  entryDate?: string;
  expectedCloseDate?: string | null;
  notes?: string | null;
  status?: "aberto" | "ganho" | "perdido";
  lostReason?: string | null;
}

function mapPipeline(row: Tables<"crm_pipelines">): Pipeline {
  return { id: row.id, name: row.name, position: row.position };
}

function mapStage(row: Tables<"crm_stages">): Stage {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    name: row.name,
    color: row.color,
    position: row.position,
    isWon: row.is_won,
    isLost: row.is_lost,
  };
}

function mapLead(row: Tables<"crm_leads">): Lead {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    stageId: row.stage_id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    responsibleId: row.responsible_id,
    source: row.source,
    serviceId: row.service_id,
    expectedValue: row.expected_value !== null ? Number(row.expected_value) : null,
    entryDate: row.entry_date,
    expectedCloseDate: row.expected_close_date,
    notes: row.notes,
    status: row.status,
    lostReason: row.lost_reason,
  };
}

async function loadCrmData(): Promise<{ pipelines: Pipeline[]; stages: Stage[]; leads: Lead[] }> {
  const supabase = createSupabaseClient();
  const [pipelinesRes, stagesRes, leadsRes] = await Promise.all([
    supabase.from("crm_pipelines").select("*").order("position"),
    supabase.from("crm_stages").select("*").order("position"),
    supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
  ]);

  if (pipelinesRes.error) throw pipelinesRes.error;
  if (stagesRes.error) throw stagesRes.error;
  if (leadsRes.error) throw leadsRes.error;

  return {
    pipelines: (pipelinesRes.data ?? []).map(mapPipeline),
    stages: (stagesRes.data ?? []).map(mapStage),
    leads: (leadsRes.data ?? []).map(mapLead),
  };
}

export function useCrmData() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadCrmData();
      setPipelines(data.pipelines);
      setStages(data.stages);
      setLeads(data.leads);
    } catch {
      setError("Não foi possível carregar o CRM. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadCrmData()
      .then((data) => {
        if (!active) return;
        setPipelines(data.pipelines);
        setStages(data.stages);
        setLeads(data.leads);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o CRM. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { pipelines, stages, leads, loading, error, refetch };
}

export async function createPipeline(name: string): Promise<Pipeline> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("crm_pipelines")
    .insert({ organization_id: organizationId, name })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar pipeline.");

  // Every pipeline needs at least one stage to be usable — a single
  // sensible default the user immediately renames/extends, never a fixed
  // stage list baked into the app.
  await supabase
    .from("crm_stages")
    .insert({ organization_id: organizationId, pipeline_id: data.id, name: "Novo", position: 0 });

  return mapPipeline(data);
}

export async function renamePipeline(id: string, name: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("crm_pipelines").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function removePipeline(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("crm_pipelines").delete().eq("id", id);
  if (error) throw error;
}

export interface StageInput {
  name: string;
  color: string;
  isWon: boolean;
  isLost: boolean;
}

export async function createStage(pipelineId: string, input: StageInput, position: number): Promise<void> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { error } = await supabase.from("crm_stages").insert({
    organization_id: organizationId,
    pipeline_id: pipelineId,
    name: input.name,
    color: input.color,
    is_won: input.isWon,
    is_lost: input.isLost,
    position,
  });
  if (error) throw error;
}

export async function updateStage(id: string, input: StageInput): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("crm_stages")
    .update({ name: input.name, color: input.color, is_won: input.isWon, is_lost: input.isLost })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderStages(stageIdsInOrder: string[]): Promise<void> {
  const supabase = createSupabaseClient();
  await Promise.all(
    stageIdsInOrder.map((id, index) => supabase.from("crm_stages").update({ position: index }).eq("id", id)),
  );
}

export async function removeStage(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("crm_stages").delete().eq("id", id);
  if (error) throw error;
}

function toLeadRowPayload(input: LeadInput, organizationId: string) {
  return {
    organization_id: organizationId,
    pipeline_id: input.pipelineId,
    stage_id: input.stageId,
    name: input.name,
    company: input.company || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    email: input.email || null,
    responsible_id: input.responsibleId || null,
    source: input.source || null,
    service_id: input.serviceId || null,
    expected_value: input.expectedValue ?? null,
    entry_date: input.entryDate || undefined,
    expected_close_date: input.expectedCloseDate || null,
    notes: input.notes || null,
    status: input.status ?? "aberto",
    lost_reason: input.lostReason || null,
  };
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("crm_leads")
    .insert(toLeadRowPayload(input, organizationId))
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar negócio.");
  return mapLead(data);
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("crm_leads")
    .update(toLeadRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao atualizar negócio.");
  return mapLead(data);
}

export async function removeLead(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("crm_leads").delete().eq("id", id);
  if (error) throw error;
}

/** Persists the drag-and-drop move immediately and logs it to crm_lead_stage_history. */
export async function moveLeadToStage(leadId: string, fromStageId: string, toStageId: string): Promise<void> {
  if (fromStageId === toStageId) return;
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("crm_leads").update({ stage_id: toStageId }).eq("id", leadId);
  if (error) throw error;

  await supabase.from("crm_lead_stage_history").insert({
    organization_id: organizationId,
    lead_id: leadId,
    from_stage_id: fromStageId,
    to_stage_id: toStageId,
    moved_by: user?.id ?? null,
  });
}
