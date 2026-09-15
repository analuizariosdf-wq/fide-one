import type { Payment } from "@/lib/types";

export const upcomingPayments: Payment[] = [
  {
    id: "p1",
    clientId: "inovar",
    description: "Mensalidade — Setembro",
    amount: 6500,
    dueLabel: "18/09",
    dueDate: "2026-09-18",
    status: "proximo",
  },
  {
    id: "p2",
    clientId: "pleno",
    description: "Mensalidade — Setembro",
    amount: 8200,
    dueLabel: "20/09",
    dueDate: "2026-09-20",
    status: "proximo",
  },
  {
    id: "p3",
    clientId: "conservar",
    description: "Produção de conteúdo extra",
    amount: 3750,
    dueLabel: "22/09",
    dueDate: "2026-09-22",
    status: "previsto",
  },
];
