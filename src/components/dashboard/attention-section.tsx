import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AttentionItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const dotClasses: Record<AttentionItem["severity"], string> = {
  danger: "bg-status-danger-dot",
  warning: "bg-status-warning-dot",
};

export function AttentionSection({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atenção</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn("size-2 shrink-0 rounded-full", dotClasses[item.severity])}
                aria-hidden
              />
              {item.label}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
