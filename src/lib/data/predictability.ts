import type { Contract } from "@/lib/data/contracts";
import type { FinancialCategory, FinancialTransaction } from "@/lib/types";
import { toISODate } from "@/lib/format";

/**
 * Normalizes any billing period to a monthly-equivalent value so MRR and
 * multi-month projections can sum contracts on different cadences without
 * a fictional conversion — a quarterly contract really does contribute
 * 1/3 of its value per month, on average.
 */
function monthlyEquivalent(contract: Contract): number {
  if (!contract.monthlyValue) return 0;
  switch (contract.billingPeriod) {
    case "mensal":
      return contract.monthlyValue;
    case "trimestral":
      return contract.monthlyValue / 3;
    case "semestral":
      return contract.monthlyValue / 6;
    case "anual":
      return contract.monthlyValue / 12;
    case "unico":
      return 0;
  }
}

export interface PredictabilityWindow {
  months: number;
  mrr: number;
  projectedRecurringRevenue: number;
  pendingReceivables: number;
  activeContractsCount: number;
  endingContracts: Contract[];
  atRiskMonthlyRevenue: number;
}

/**
 * Every number here comes from real `contracts` and `financial_transactions`
 * rows — no forecasting model, no AI. "Projected recurring revenue" is
 * simply MRR × months, adjusted down for contracts that end inside the
 * window (they stop contributing from their end_date on).
 */
export function computePredictability(
  contracts: Contract[],
  transactions: FinancialTransaction[],
  categoriesById: Map<string, FinancialCategory>,
  months: number,
  referenceDate: Date,
): PredictabilityWindow {
  const todayISO = toISODate(referenceDate);
  const windowEnd = new Date(referenceDate);
  windowEnd.setMonth(windowEnd.getMonth() + months);
  const windowEndISO = toISODate(windowEnd);

  const activeContracts = contracts.filter((c) => c.status === "ativo");
  const mrr = activeContracts.reduce((sum, c) => sum + monthlyEquivalent(c), 0);

  const endingContracts = activeContracts.filter(
    (c) => c.endDate && c.endDate >= todayISO && c.endDate <= windowEndISO,
  );
  const atRiskMonthlyRevenue = endingContracts.reduce((sum, c) => sum + monthlyEquivalent(c), 0);

  // Simple month-by-month projection: contracts ending partway through the
  // window stop contributing from their end date, everything else holds.
  let projectedRecurringRevenue = 0;
  for (let m = 0; m < months; m++) {
    const monthStart = new Date(referenceDate);
    monthStart.setMonth(monthStart.getMonth() + m);
    const monthStartISO = toISODate(monthStart);
    for (const contract of activeContracts) {
      if (contract.endDate && contract.endDate < monthStartISO) continue;
      projectedRecurringRevenue += monthlyEquivalent(contract);
    }
  }

  const pendingReceivables = transactions.reduce((sum, transaction) => {
    if (transaction.status === "pago") return sum;
    const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
    if (category?.type !== "receita") return sum;
    if (!transaction.dueDate || transaction.dueDate > windowEndISO) return sum;
    return sum + transaction.amount;
  }, 0);

  return {
    months,
    mrr,
    projectedRecurringRevenue,
    pendingReceivables,
    activeContractsCount: activeContracts.length,
    endingContracts,
    atRiskMonthlyRevenue,
  };
}
