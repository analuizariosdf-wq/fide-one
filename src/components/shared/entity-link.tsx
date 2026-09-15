import Link from "next/link";

import { cn } from "@/lib/utils";

interface EntityLinkProps {
  href: string;
  children: string;
  className?: string;
  muted?: boolean;
}

function EntityLink({ href, children, className, muted }: EntityLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "font-medium hover:underline hover:text-primary",
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export { EntityLink };
