"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface FilterBarProps {
  search?: ReactNode;
  filters: ReactNode;
  activeCount?: number;
}

function FilterBar({ search, filters, activeCount = 0 }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {search && <div className="min-w-[220px] flex-1">{search}</div>}

      <div className="hidden flex-wrap items-center gap-2 md:flex">{filters}</div>

      <Button
        variant="outline"
        size="sm"
        className="justify-center md:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtros
        {activeCount > 0 && (
          <Badge variant="primary" className="ml-0.5 px-1.5">
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-6 pb-6">{filters}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { FilterBar };
