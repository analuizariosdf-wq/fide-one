"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export interface Label {
  id: string;
  name: string;
  color: string;
}

function mapLabel(row: Tables<"labels">): Label {
  return { id: row.id, name: row.name, color: row.color };
}

async function loadLabels(): Promise<Label[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("labels").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapLabel);
}

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLabels(await loadLabels());
    } catch {
      setError("Não foi possível carregar as etiquetas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadLabels()
      .then((data) => {
        if (active) setLabels(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar as etiquetas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { labels, loading, error, refetch };
}

export async function createLabel(name: string, color: string): Promise<Label> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { data, error } = await supabase
    .from("labels")
    .insert({ organization_id: organizationId, name, color })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar etiqueta.");
  return mapLabel(data);
}

export async function updateLabel(id: string, name: string, color: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("labels").update({ name, color }).eq("id", id);
  if (error) throw error;
}

export async function removeLabel(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("labels").delete().eq("id", id);
  if (error) throw error;
}

async function loadContentLabelIds(contentId: string): Promise<string[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("content_labels").select("label_id").eq("content_id", contentId);
  if (error) throw error;
  return (data ?? []).map((row) => row.label_id);
}

/** Delete-then-insert sync — same pattern as syncClientServices/content_tasks. */
export async function syncContentLabels(contentId: string, labelIds: string[]): Promise<void> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { error: deleteError } = await supabase.from("content_labels").delete().eq("content_id", contentId);
  if (deleteError) throw deleteError;

  if (labelIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("content_labels")
    .insert(labelIds.map((labelId) => ({ content_id: contentId, label_id: labelId, organization_id: organizationId })));
  if (insertError) throw insertError;
}

export async function loadAllContentLabels(): Promise<Map<string, string[]>> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("content_labels").select("content_id, label_id");
  if (error) throw error;

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.content_id) ?? [];
    list.push(row.label_id);
    map.set(row.content_id, list);
  }
  return map;
}

export { loadContentLabelIds };
