"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import { MOCK_TODAY, toISODate } from "@/lib/format";
import type {
  FinancialCategory,
  FinancialCategoryType,
  FinancialTransaction,
  FinancialTransactionStatus,
} from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import {
  financialCategoryInputSchema,
  financialTransactionInputSchema,
  type FinancialCategoryInput,
  type FinancialTransactionInput,
} from "@/lib/data/financial-schema";

export type { FinancialTransactionInput, FinancialCategoryInput };

export interface ClientOption {
  id: string;
  name: string;
}

export type FinancialTypeFilter = FinancialCategoryType | "todos";

export interface FinancialFilters {
  search?: string;
  type?: FinancialTypeFilter;
  status?: FinancialTransactionStatus | "todos";
  clientId?: string | "todos";
  categoryId?: string | "todos";
  dueFrom?: string;
  dueTo?: string;
}

function mapCategory(row: Tables<"financial_categories">): FinancialCategory {
  return { id: row.id, name: row.name, type: row.type };
}

function mapTransaction(row: Tables<"financial_transactions">): FinancialTransaction {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    categoryId: row.category_id,
    description: row.description,
    amount: Number(row.amount),
    dueDate: row.due_date,
    paidAt: row.paid_at,
    status: row.status,
  };
}

interface LoadedData {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  clients: ClientOption[];
}

/** Same flat-queries-joined-in-JS approach as every other real Data Layer. */
async function loadFinancialData(): Promise<LoadedData> {
  const supabase = createSupabaseClient();

  const [transactionsRes, categoriesRes, clientsRes] = await Promise.all([
    supabase.from("financial_transactions").select("*").order("due_date", { ascending: true }),
    supabase.from("financial_categories").select("*").order("name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (transactionsRes.error) throw transactionsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (clientsRes.error) throw clientsRes.error;

  return {
    transactions: (transactionsRes.data ?? []).map(mapTransaction),
    categories: (categoriesRes.data ?? []).map(mapCategory),
    clients: clientsRes.data ?? [],
  };
}

export function useFinancialData() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadFinancialData();
      setTransactions(data.transactions);
      setCategories(data.categories);
      setClients(data.clients);
    } catch {
      setError("Não foi possível carregar os dados financeiros. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadFinancialData()
      .then((data) => {
        if (!active) return;
        setTransactions(data.transactions);
        setCategories(data.categories);
        setClients(data.clients);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os dados financeiros. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { transactions, categories, clients, loading, error, refetch };
}

/**
 * The schema persists "atrasado" as a valid status, but nothing writes it
 * automatically (no trigger, no cron) — so a transaction left as
 * "previsto"/"proximo" past its due date would show a stale status
 * forever if the UI trusted the stored value alone. This derives the
 * effective status for display/filtering without ever silently rewriting
 * the row; the user can still set status to "atrasado" explicitly, which
 * this respects as-is.
 */
export function getEffectiveStatus(transaction: FinancialTransaction): FinancialTransactionStatus {
  if (transaction.status === "pago" || transaction.status === "atrasado") return transaction.status;
  if (transaction.dueDate && transaction.dueDate < toISODate(MOCK_TODAY)) return "atrasado";
  return transaction.status;
}

export function filterTransactions(
  items: FinancialTransaction[],
  categoriesById: Map<string, FinancialCategory>,
  filters: FinancialFilters,
): FinancialTransaction[] {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((transaction) => {
    if (search && !transaction.description.toLowerCase().includes(search)) return false;

    const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
    if (filters.type && filters.type !== "todos" && category?.type !== filters.type) return false;

    if (filters.categoryId && filters.categoryId !== "todos" && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.clientId && filters.clientId !== "todos" && transaction.clientId !== filters.clientId) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && getEffectiveStatus(transaction) !== filters.status) {
      return false;
    }
    if (filters.dueFrom && (!transaction.dueDate || transaction.dueDate < filters.dueFrom)) return false;
    if (filters.dueTo && (!transaction.dueDate || transaction.dueDate > filters.dueTo)) return false;

    return true;
  });
}

export interface CashFlowSummary {
  entradas: number;
  saidas: number;
  saldo: number;
  aReceber: number;
  aPagar: number;
  vencidas: number;
  vencidasCount: number;
}

/**
 * "Entradas"/"saídas" only count what's actually settled (`pago`) — a
 * receivable that hasn't been received yet isn't cash flow, it's a
 * forecast (`aReceber`/`aPagar`). Only receita/despesa the category
 * carries decides the sign; a transaction without a resolvable category
 * (orphaned category_id) is excluded from every sum rather than guessed.
 */
export function computeCashFlowSummary(
  items: FinancialTransaction[],
  categoriesById: Map<string, FinancialCategory>,
): CashFlowSummary {
  let entradas = 0;
  let saidas = 0;
  let aReceber = 0;
  let aPagar = 0;
  let vencidas = 0;
  let vencidasCount = 0;

  for (const transaction of items) {
    const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
    if (!category) continue;

    const effectiveStatus = getEffectiveStatus(transaction);
    const isPaid = transaction.status === "pago";

    if (isPaid) {
      if (category.type === "receita") entradas += transaction.amount;
      else saidas += transaction.amount;
      continue;
    }

    if (category.type === "receita") aReceber += transaction.amount;
    else aPagar += transaction.amount;

    if (effectiveStatus === "atrasado") {
      vencidas += transaction.amount;
      vencidasCount += 1;
    }
  }

  return { entradas, saidas, saldo: entradas - saidas, aReceber, aPagar, vencidas, vencidasCount };
}

export function useCashFlowSummary(
  transactions: FinancialTransaction[],
  categories: FinancialCategory[],
): CashFlowSummary {
  return useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    return computeCashFlowSummary(transactions, categoriesById);
  }, [transactions, categories]);
}

/** Same reasoning as the equivalent asserts in tasks.ts/contents.ts/calendar.ts. */
async function assertClientBelongsToOrg(clientId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente inválido para esta organização.");
}

async function assertCategoryBelongsToOrg(categoryId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("financial_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Categoria inválida para esta organização.");
}

function toRowPayload(input: FinancialTransactionInput, organizationId: string) {
  return {
    organization_id: organizationId,
    client_id: input.clientId,
    category_id: input.categoryId,
    description: input.description,
    amount: input.amount,
    due_date: input.dueDate || null,
    paid_at: input.status === "pago" ? input.paidAt || toISODate(MOCK_TODAY) : null,
    status: input.status,
  };
}

export async function createTransaction(rawInput: FinancialTransactionInput): Promise<FinancialTransaction> {
  const input = financialTransactionInputSchema.parse(rawInput);
  await assertCategoryBelongsToOrg(input.categoryId);
  if (input.clientId) await assertClientBelongsToOrg(input.clientId);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert(toRowPayload(input, organizationId))
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar lançamento.");

  return mapTransaction(data);
}

export async function updateTransaction(
  id: string,
  rawInput: FinancialTransactionInput,
): Promise<FinancialTransaction> {
  const input = financialTransactionInputSchema.parse(rawInput);
  await assertCategoryBelongsToOrg(input.categoryId);
  if (input.clientId) await assertClientBelongsToOrg(input.clientId);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("financial_transactions")
    .update(toRowPayload(input, organizationId))
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar lançamento.");

  return mapTransaction(data);
}

/** Used by the table's "marcar como pago/recebido" quick action. */
export async function setTransactionPaid(id: string, paid: boolean): Promise<FinancialTransaction> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("financial_transactions")
    .update({
      status: paid ? "pago" : "previsto",
      paid_at: paid ? toISODate(MOCK_TODAY) : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao atualizar o pagamento.");

  return mapTransaction(data);
}

export async function removeTransaction(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Simple inline creation from the transaction form's category picker — not
 * a full categories management screen (out of scope for the MVP).
 */
export async function createFinancialCategory(rawInput: FinancialCategoryInput): Promise<FinancialCategory> {
  const input = financialCategoryInputSchema.parse(rawInput);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();

  const { data, error } = await supabase
    .from("financial_categories")
    .insert({ organization_id: organizationId, name: input.name, type: input.type })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao criar categoria.");

  return mapCategory(data);
}
