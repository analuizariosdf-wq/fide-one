import { AtSign, Globe, Mail, Phone } from "lucide-react";

import type { Client } from "@/lib/types";
import { getTeamMember } from "@/lib/mock-data/users";
import { formatCurrencyBRL, formatDateShort } from "@/lib/format";
import { clientStatusConfig } from "@/lib/status";
import { Badge } from "@/components/ui/badge";

export function ClientHeader({ client }: { client: Client }) {
  const responsible = getTeamMember(client.responsibleId);
  const status = clientStatusConfig[client.status];
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-[18px] font-bold text-accent-foreground">
          {initials}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1>{client.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">{client.segment}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-5 py-4 sm:grid-cols-4">
        <MetaField label="Responsável" value={responsible?.name ?? "—"} />
        <MetaField label="Mensalidade" value={formatCurrencyBRL(client.monthlyFee)} />
        <MetaField label="Início do contrato" value={formatDateShort(client.startDate)} />
        <MetaField
          label="Contato"
          value={client.email || client.phone || "—"}
        />
      </div>

      {(client.website || client.instagram || client.email || client.phone) && (
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-primary"
            >
              <Globe className="size-3.5" />
              {client.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {client.instagram && (
            <a
              href={`https://instagram.com/${client.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-primary"
            >
              <AtSign className="size-3.5" />
              {client.instagram}
            </a>
          )}
          {client.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {client.email}
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {client.phone}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}
