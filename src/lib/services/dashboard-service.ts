import {
  attentionItems,
  clients,
  contents,
  currentUser,
  dashboardStats,
  myTasks,
  recentActivity,
  team,
  upcomingPayments,
} from "@/lib/mock-data";
import type {
  ActivityItem,
  AttentionItem,
  Client,
  ContentItem,
  Payment,
  TaskItem,
  TeamMember,
} from "@/lib/types";

/**
 * Data layer for the dashboard. Today it reads from static mock data;
 * once Supabase is connected, only the function bodies below change —
 * the UI keeps calling this same interface.
 */
export interface DashboardData {
  user: TeamMember;
  stats: typeof dashboardStats;
  attention: AttentionItem[];
  upcomingContents: ContentItem[];
  myTasks: TaskItem[];
  recentActivity: ActivityItem[];
  clients: Client[];
  team: TeamMember[];
  payments: Payment[];
}

export function getDashboardData(): DashboardData {
  return {
    user: currentUser,
    stats: dashboardStats,
    attention: attentionItems,
    upcomingContents: contents,
    myTasks,
    recentActivity,
    clients,
    team,
    payments: upcomingPayments,
  };
}
