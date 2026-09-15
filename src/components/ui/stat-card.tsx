import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps extends ComponentProps<"div"> {
  label: string;
  value: string;
  helperText?: string;
  helperTone?: "neutral" | "danger" | "warning" | "success";
  icon?: LucideIcon;
}

const toneClasses: Record<NonNullable<StatCardProps["helperTone"]>, string> = {
  neutral: "text-muted-foreground",
  danger: "text-status-danger-fg",
  warning: "text-status-warning-fg",
  success: "text-status-success-fg",
};

function StatCard({
  label,
  value,
  helperText,
  helperTone = "neutral",
  icon: Icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      data-slot="stat-card"
      className={cn("gap-3 p-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="text-[28px] font-bold leading-none tracking-tight text-foreground">
        {value}
      </p>
      {helperText && (
        <p className={cn("text-[13px] font-medium", toneClasses[helperTone])}>
          {helperText}
        </p>
      )}
    </Card>
  );
}

export { StatCard };
