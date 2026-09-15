import { Wallet } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function FinanceiroPage() {
  return (
    <PlaceholderPage
      icon={Wallet}
      title="Financeiro"
      description="Contas a receber, pagamentos e saúde financeira da agência."
    />
  );
}
