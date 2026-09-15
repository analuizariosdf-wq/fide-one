import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium w-fit whitespace-nowrap shrink-0",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border-border",
        outline: "bg-transparent text-foreground border-border",
        primary: "bg-accent text-accent-foreground border-transparent",
        danger:
          "bg-status-danger-bg text-status-danger-fg border-transparent",
        warning:
          "bg-status-warning-bg text-status-warning-fg border-transparent",
        success:
          "bg-status-success-bg text-status-success-fg border-transparent",
        info: "bg-status-info-bg text-status-info-fg border-transparent",
        neutral:
          "bg-status-neutral-bg text-status-neutral-fg border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
