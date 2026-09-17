"use client";

import { useCallback, useMemo } from "react";

import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { useTasks } from "@/lib/data/tasks";
import { useContents } from "@/lib/data/contents";
import { useFinancialData, useCashFlowSummary } from "@/lib/data/financial";
import { MOCK_TODAY, toISODate } from "@/lib/format";
import type { AttentionItem, Content, Task } from "@/lib/types";

/**
 * Fase 5.8: the Dashboard used to read from static Etapa-1 mock arrays
 * (dashboardStats, attentionItems, myTasks, upcomingContents,
 * recentActivity — see docs/project-status.md's mock inventory). Every
 * card that represents an already-migrated module (Tarefas, Conteúdos)
 * now reads the same real data layers those modules use. "Atividade
 * recente" has no real source either — nothing writes activity_logs yet
 * — so it stays an honest empty state, not mock activity.
 *
 * Fase 6: Financeiro is real now, so "A receber" uses the same
 * useCashFlowSummary() the Financeiro module itself uses — pending
 * receivables only (not yet paid), never a fabricated number.
 */
export function useDashboardData() {
  const { profile } = useCurrentActor();
  const {
    tasks,
    clients: taskClients,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks();
  const {
    contents,
    clients: contentClients,
    profiles: contentProfiles,
    loading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useContents();
  const {
    transactions,
    categories: financialCategories,
    loading: financialLoading,
    error: financialError,
    refetch: refetchFinancial,
  } = useFinancialData();
  const cashFlow = useCashFlowSummary(transactions, financialCategories);

  const loading = tasksLoading || contentsLoading || financialLoading;
  const error = tasksError ?? contentsError ?? financialError;

  const refetch = useCallback(() => {
    refetchTasks();
    refetchContents();
    refetchFinancial();
  }, [refetchTasks, refetchContents, refetchFinancial]);

  const todayISO = toISODate(MOCK_TODAY);
  const weekEndDate = new Date(MOCK_TODAY);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEndISO = toISODate(weekEndDate);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "concluido" && task.status !== "cancelado"),
    [tasks],
  );
  const overdueTasks = useMemo(
    () => openTasks.filter((task) => task.dueDate && task.dueDate < todayISO),
    [openTasks, todayISO],
  );
  const myTasks = useMemo<Task[]>(
    () =>
      profile
        ? openTasks
            .filter((task) => task.assigneeId === profile.id)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 5)
        : [],
    [openTasks, profile],
  );

  const contentsThisWeek = useMemo(
    () => contents.filter((content) => content.publishDate >= todayISO && content.publishDate <= weekEndISO),
    [contents, todayISO, weekEndISO],
  );
  const awaitingApproval = useMemo(
    () => contents.filter((content) => content.status === "aprovacao"),
    [contents],
  );
  const upcomingContents = useMemo<Content[]>(
    () =>
      contents
        .filter((content) => content.publishDate >= todayISO)
        .sort(
          (a, b) => a.publishDate.localeCompare(b.publishDate) || (a.publishTime ?? "").localeCompare(b.publishTime ?? ""),
        )
        .slice(0, 5),
    [contents, todayISO],
  );

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (overdueTasks.length > 0) {
      items.push({
        id: "attention-overdue-tasks",
        label: `${overdueTasks.length} tarefa${overdueTasks.length > 1 ? "s" : ""} atrasada${overdueTasks.length > 1 ? "s" : ""}`,
        severity: "danger",
        href: "/tasks",
      });
    }
    if (awaitingApproval.length > 0) {
      items.push({
        id: "attention-awaiting-approval",
        label: `${awaitingApproval.length} conteúdo${awaitingApproval.length > 1 ? "s" : ""} aguardando aprovação`,
        severity: "warning",
        href: "/contents",
      });
    }
    if (cashFlow.vencidasCount > 0) {
      items.push({
        id: "attention-overdue-transactions",
        label: `${cashFlow.vencidasCount} lançamento${cashFlow.vencidasCount > 1 ? "s" : ""} financeiro${cashFlow.vencidasCount > 1 ? "s" : ""} vencido${cashFlow.vencidasCount > 1 ? "s" : ""}`,
        severity: "danger",
        href: "/financeiro",
      });
    }
    return items;
  }, [overdueTasks, awaitingApproval, cashFlow.vencidasCount]);

  return {
    userName: profile?.name ?? "Você",
    loading,
    error,
    refetch,
    kpis: {
      tasksValue: openTasks.length,
      tasksHelper: overdueTasks.length > 0 ? `${overdueTasks.length} atrasada${overdueTasks.length > 1 ? "s" : ""}` : "Nenhuma atrasada",
      tasksOverdue: overdueTasks.length > 0,
      contentsValue: contents.length,
      contentsHelper: `${contentsThisWeek.length} nesta semana`,
      receivableValue: cashFlow.aReceber,
      payableValue: cashFlow.aPagar,
      overdueTransactionsCount: cashFlow.vencidasCount,
    },
    attentionItems,
    myTasks,
    taskClients,
    upcomingContents,
    contentClients,
    contentProfiles,
  };
}
