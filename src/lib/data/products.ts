"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import type { Tables } from "@/lib/supabase/database.types";

export type ProductBillingType = "recorrente" | "pontual";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number | null;
  billingType: ProductBillingType | null;
  billingPeriod: string | null;
  category: string | null;
  active: boolean;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  defaultPrice?: number | null;
  billingType: ProductBillingType;
  billingPeriod?: string | null;
  category?: string | null;
  active: boolean;
}

/**
 * Reuses the `services` table (already the catalog behind
 * `client_services`) instead of a parallel `products` entity — same
 * underlying rows, richer columns added in the Fase 10 migration.
 */
function mapProduct(row: Tables<"services">): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultPrice: row.default_price !== null ? Number(row.default_price) : null,
    billingType: row.billing_type,
    billingPeriod: row.billing_period,
    category: row.category,
    active: row.active,
  };
}

async function loadProducts(): Promise<Product[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("services").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await loadProducts());
    } catch {
      setError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os produtos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error, refetch };
}

function toRowPayload(input: ProductInput, organizationId: string) {
  return {
    organization_id: organizationId,
    name: input.name,
    description: input.description || null,
    default_price: input.defaultPrice ?? null,
    billing_type: input.billingType,
    billing_period: input.billingType === "recorrente" ? input.billingPeriod || null : null,
    category: input.category || null,
    active: input.active,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("services")
    .insert(toRowPayload(input, organizationId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar produto.");
  return mapProduct(data);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("services")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar produto.");
  return mapProduct(data);
}

export async function removeProduct(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}
