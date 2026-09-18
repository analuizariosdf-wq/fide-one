"use client";

import { useCallback, useMemo } from "react";

import { useCurrentActor } from "@/lib/auth/current-actor-context";
import { useTasks } from "@/lib/data/tasks";
import { useContents } from "@/lib/data/contents";
import { MOCK_TODAY, toISODate } from "@/lib/format";
import type { AttentionItem, Content, Task } from "@/lib/types";

/**
 * Fase 10: the general Dashboard is operational only — no financial
 * figure appears here at all (Financeiro has its own dashboard, gated by
 * finance.view, inside /financeiro). Every card reads the same real data
 * layers those modules use. "Atividade recente" has no real source yet
 * (nothing writes activity_logs) so it stays an honest empty state.
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

  const loading = tasksLoading || contentsLoading;
  const error = tasksError ?? contentsError;

  const refetch = useCallback(() => {
    refetchTasks();
    refetchContents();
  }, [refetchTasks, refetchContents]);

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
    return items;
  }, [overdueTasks, awaitingApproval]);

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
      awaitingApprovalValue: awaitingApproval.length,
    },
    attentionItems,
    myTasks,
    taskClients,
    upcomingContents,
    contentClients,
    contentProfiles,
  };
}
