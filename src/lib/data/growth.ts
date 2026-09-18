"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import { toISODate } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

export interface RevenueTarget {
  id: string;
  period: string;
  targetAmount: number;
}

export interface RevenueTargetItem {
  id: string;
  revenueTargetId: string;
  serviceId: string;
  plannedQuantity: number;
}

function firstDayOfMonth(date: Date): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function mapTarget(row: Tables<"revenue_targets">): RevenueTarget {
  return { id: row.id, period: row.period, targetAmount: Number(row.target_amount) };
}

function mapItem(row: Tables<"revenue_target_items">): RevenueTargetItem {
  return {
    id: row.id,
    revenueTargetId: row.revenue_target_id,
    serviceId: row.service_id,
    plannedQuantity: row.planned_quantity,
  };
}

async function loadGrowthData(period: string): Promise<{ target: RevenueTarget | null; items: RevenueTargetItem[] }> {
  const supabase = createSupabaseClient();
  const { data: targetRow, error: targetError } = await supabase
    .from("revenue_targets")
    .select("*")
    .eq("period", period)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!targetRow) return { target: null, items: [] };

  const { data: itemRows, error: itemsError } = await supabase
    .from("revenue_target_items")
    .select("*")
    .eq("revenue_target_id", targetRow.id);
  if (itemsError) throw itemsError;

  return { target: mapTarget(targetRow), items: (itemRows ?? []).map(mapItem) };
}

/** `period` defaults to the first day of the current month. */
export function useGrowthTarget(referenceDate: Date) {
  const period = firstDayOfMonth(referenceDate);
  const [target, setTarget] = useState<RevenueTarget | null>(null);
  const [items, setItems] = useState<RevenueTargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadGrowthData(period);
      setTarget(data.target);
      setItems(data.items);
    } catch {
      setError("Não foi possível carregar a meta do período. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    let active = true;
    loadGrowthData(period)
      .then((data) => {
        if (!active) return;
        setTarget(data.target);
        setItems(data.items);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a meta do período. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  return { period, target, items, loading, error, refetch };
}

export async function setMonthlyTarget(period: string, targetAmount: number): Promise<RevenueTarget> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("revenue_targets")
    .upsert(
      { organization_id: organizationId, period, target_amount: targetAmount },
      { onConflict: "organization_id,period" },
    )
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao salvar a meta.");
  return mapTarget(data);
}

export async function setPlannedQuantity(
  revenueTargetId: string,
  serviceId: string,
  plannedQuantity: number,
): Promise<void> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { error } = await supabase.from("revenue_target_items").upsert(
    { organization_id: organizationId, revenue_target_id: revenueTargetId, service_id: serviceId, planned_quantity: plannedQuantity },
    { onConflict: "revenue_target_id,service_id" },
  );
  if (error) throw error;
}
