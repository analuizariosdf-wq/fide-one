"use client";

import { useCallback, useMemo } from "react";

import { useClients } from "@/lib/data/clients";
import { useProjects } from "@/lib/data/projects";
import { useTasks } from "@/lib/data/tasks";
import { useContents } from "@/lib/data/contents";
import { useTeam, type TeamProfile } from "@/lib/data/team";
import { useFinancialData, computeCashFlowSummary, type CashFlowSummary } from "@/lib/data/financial";
import { isOverdue } from "@/lib/format";
import type { Client, Content, FinancialCategory, FinancialTransaction, Project, Task } from "@/lib/types";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string | "todos";
  projectId?: string | "todos";
  responsibleId?: string | "todos";
}

/**
 * Composes the already-existing real Data Layers (Clientes/Projetos/
 * Tarefas/Conteúdos/Equipe/Financeiro) instead of issuing new Supabase
 * queries — each underlying hook already fetches once, so this never
 * duplicates a request just to build a report on top of the same data.
 */
export function useReportsData() {
  const { clients, loading: clientsLoading, error: clientsError, refetch: refetchClients } = useClients();
  const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { contents, loading: contentsLoading, error: contentsError, refetch: refetchContents } = useContents();
  const { team, loading: teamLoading, error: teamError, refetch: refetchTeam } = useTeam();
  const {
    transactions,
    categories,
    loading: financialLoading,
    error: financialError,
    refetch: refetchFinancial,
  } = useFinancialData();

  const loading =
    clientsLoading || projectsLoading || tasksLoading || contentsLoading || teamLoading || financialLoading;
  const error = clientsError ?? projectsError ?? tasksError ?? contentsError ?? teamError ?? financialError;

  const refetch = useCallback(() => {
    refetchClients();
    refetchProjects();
    refetchTasks();
    refetchContents();
    refetchTeam();
    refetchFinancial();
  }, [refetchClients, refetchProjects, refetchTasks, refetchContents, refetchTeam, refetchFinancial]);

  return { clients, projects, tasks, contents, team, transactions, categories, loading, error, refetch };
}

function inDateRange(date: string | null | undefined, from?: string, to?: string): boolean {
  if (!date) return !from && !to;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function filterTasksForReport(tasks: Task[], filters: ReportFilters): Task[] {
  return tasks.filter((task) => {
    if (filters.clientId && filters.clientId !== "todos" && task.clientId !== filters.clientId) return false;
    if (filters.projectId && filters.projectId !== "todos" && task.projectId !== filters.projectId) return false;
    if (filters.responsibleId && filters.responsibleId !== "todos" && task.assigneeId !== filters.responsibleId) {
      return false;
    }
    if ((filters.dateFrom || filters.dateTo) && !inDateRange(task.dueDate, filters.dateFrom, filters.dateTo)) {
      return false;
    }
    return true;
  });
}

export function filterContentsForReport(contents: Content[], filters: ReportFilters): Content[] {
  return contents.filter((content) => {
    if (filters.clientId && filters.clientId !== "todos" && content.clientId !== filters.clientId) return false;
    if (filters.projectId && filters.projectId !== "todos" && content.projectId !== filters.projectId) return false;
    if (
      filters.responsibleId &&
      filters.responsibleId !== "todos" &&
      content.responsibleId !== filters.responsibleId
    ) {
      return false;
    }
    if (
      (filters.dateFrom || filters.dateTo) &&
      !inDateRange(content.publishDate, filters.dateFrom, filters.dateTo)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * `financial_transactions` has no `project_id` and no `assignee`, so only
 * `clientId` and the period actually narrow this collection — see
 * docs/project-status.md for why project-level financial filtering isn't
 * possible with the current schema.
 */
export function filterTransactionsForReport(
  transactions: FinancialTransaction[],
  filters: ReportFilters,
): FinancialTransaction[] {
  return transactions.filter((transaction) => {
    if (filters.clientId && filters.clientId !== "todos" && transaction.clientId !== filters.clientId) {
      return false;
    }
    if (
      (filters.dateFrom || filters.dateTo) &&
      !inDateRange(transaction.dueDate, filters.dateFrom, filters.dateTo)
    ) {
      return false;
    }
    return true;
  });
}

export interface OverviewMetrics {
  activeClients: number;
  activeProjects: number;
  tasksOpen: number;
  tasksCompleted: number;
  tasksOverdue: number;
  contentsTotal: number;
  contentsPublished: number;
  contentsAwaitingApproval: number;
  cashFlow: CashFlowSummary;
}

export function computeOverview(
  clients: Client[],
  projects: Project[],
  tasks: Task[],
  contents: Content[],
  transactions: FinancialTransaction[],
  categoriesById: Map<string, FinancialCategory>,
): OverviewMetrics {
  const tasksOpen = tasks.filter((t) => t.status !== "concluido" && t.status !== "cancelado");

  return {
    activeClients: clients.filter((c) => c.status === "ativo").length,
    activeProjects: projects.filter((p) => p.status === "em_andamento").length,
    tasksOpen: tasksOpen.length,
    tasksCompleted: tasks.filter((t) => t.status === "concluido").length,
    tasksOverdue: tasksOpen.filter((t) => t.dueDate && isOverdue(t.dueDate)).length,
    contentsTotal: contents.length,
    contentsPublished: contents.filter((c) => c.status === "publicado").length,
    contentsAwaitingApproval: contents.filter((c) => c.status === "aprovacao").length,
    cashFlow: computeCashFlowSummary(transactions, categoriesById),
  };
}

export interface ClientReportRow {
  client: Client;
  projectsCount: number;
  tasksOpen: number;
  tasksCompleted: number;
  tasksOverdue: number;
  contentsCount: number;
  contentsPublished: number;
  revenue: number;
  pendingRevenue: number;
  expense: number;
  result: number;
}

/**
 * Revenue/expense here come straight from `financial_transactions.client_id`
 * — a real column, not an inferred allocation. A transaction with no
 * client (`client_id is null`, i.e. an internal/agency-wide cost) never
 * counts toward any client's result.
 */
export function computeClientReports(
  clients: Client[],
  projects: Project[],
  tasks: Task[],
  contents: Content[],
  transactions: FinancialTransaction[],
  categoriesById: Map<string, FinancialCategory>,
): ClientReportRow[] {
  return clients.map((client) => {
    const clientProjects = projects.filter((p) => p.clientId === client.id);
    const clientTasks = tasks.filter((t) => t.clientId === client.id);
    const openTasks = clientTasks.filter((t) => t.status !== "concluido" && t.status !== "cancelado");
    const clientContents = contents.filter((c) => c.clientId === client.id);
    const clientTransactions = transactions.filter((t) => t.clientId === client.id);

    let revenue = 0;
    let pendingRevenue = 0;
    let expense = 0;
    for (const transaction of clientTransactions) {
      const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
      if (!category) continue;
      if (category.type === "receita") {
        if (transaction.status === "pago") revenue += transaction.amount;
        else pendingRevenue += transaction.amount;
      } else if (transaction.status === "pago") {
        expense += transaction.amount;
      }
    }

    return {
      client,
      projectsCount: clientProjects.length,
      tasksOpen: openTasks.length,
      tasksCompleted: clientTasks.filter((t) => t.status === "concluido").length,
      tasksOverdue: openTasks.filter((t) => t.dueDate && isOverdue(t.dueDate)).length,
      contentsCount: clientContents.length,
      contentsPublished: clientContents.filter((c) => c.status === "publicado").length,
      revenue,
      pendingRevenue,
      expense,
      result: revenue - expense,
    };
  });
}

export interface ProjectReportRow {
  project: Project;
  client: Client | undefined;
  responsible: TeamProfile | undefined;
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  contentsCount: number;
}

/**
 * No financial figure here on purpose: `financial_transactions` has no
 * `project_id` column, so there is no real (non-invented) way to compute
 * revenue/cost/margin per project with the current schema — only
 * operational metrics (tasks/conteúdos/progresso) are shown. See
 * docs/project-status.md.
 */
export function computeProjectReports(
  projects: Project[],
  tasks: Task[],
  contents: Content[],
  clients: Client[],
  team: TeamProfile[],
): ProjectReportRow[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const profileById = new Map(team.map((p) => [p.id, p]));

  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const openTasks = projectTasks.filter((t) => t.status !== "concluido" && t.status !== "cancelado");

    return {
      project,
      client: clientById.get(project.clientId),
      responsible: profileById.get(project.responsibleId),
      tasksTotal: projectTasks.length,
      tasksCompleted: projectTasks.filter((t) => t.status === "concluido").length,
      tasksOverdue: openTasks.filter((t) => t.dueDate && isOverdue(t.dueDate)).length,
      contentsCount: contents.filter((c) => c.projectId === project.id).length,
    };
  });
}

export interface WorkloadRow {
  profile: TeamProfile;
  open: number;
  inProgress: number;
  overdue: number;
  completed: number;
  total: number;
  /**
   * Purely a relative volume signal (open tasks vs. the team's average) —
   * never a productivity/performance score. See the UI copy in
   * src/app/(app)/relatorios/page.tsx.
   */
  aboveAverageVolume: boolean;
}

export interface WorkloadReport {
  rows: WorkloadRow[];
  unassignedTasks: Task[];
}

const IN_PROGRESS_STATUSES: Task["status"][] = ["em_producao", "em_revisao", "aguardando_cliente"];

/**
 * Volume of tasks only — no hours, no estimates, no timesheet exist in
 * the schema, so none are fabricated here (see docs/project-status.md).
 */
export function computeWorkloadReport(tasks: Task[], team: TeamProfile[]): WorkloadReport {
  const unassignedTasks = tasks.filter((t) => !t.assigneeId);

  const perProfile = team.map((profile) => {
    const assigned = tasks.filter((t) => t.assigneeId === profile.id);
    const open = assigned.filter((t) => t.status !== "concluido" && t.status !== "cancelado");

    return {
      profile,
      open: open.length,
      inProgress: assigned.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length,
      overdue: open.filter((t) => t.dueDate && isOverdue(t.dueDate)).length,
      completed: assigned.filter((t) => t.status === "concluido").length,
      total: assigned.length,
    };
  });

  const membersWithTasks = perProfile.filter((row) => row.total > 0);
  const averageOpen =
    membersWithTasks.length > 0
      ? membersWithTasks.reduce((sum, row) => sum + row.open, 0) / membersWithTasks.length
      : 0;

  const rows: WorkloadRow[] = perProfile.map((row) => ({
    ...row,
    aboveAverageVolume: averageOpen > 0 && row.open > averageOpen * 1.5,
  }));

  return { rows, unassignedTasks };
}

export function useReportCategoriesById(categories: FinancialCategory[]): Map<string, FinancialCategory> {
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
}
