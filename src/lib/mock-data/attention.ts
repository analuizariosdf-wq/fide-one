import type { AttentionItem } from "@/lib/types";

export const attentionItems: AttentionItem[] = [
  {
    id: "at1",
    label: "5 tarefas atrasadas",
    severity: "danger",
    href: "/tasks",
  },
  {
    id: "at2",
    label: "3 conteúdos aguardando aprovação",
    severity: "warning",
    href: "/contents",
  },
  {
    id: "at3",
    label: "2 pagamentos próximos do vencimento",
    severity: "warning",
    href: "/financeiro",
  },
];
