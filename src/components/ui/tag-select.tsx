"use client";

import { cn } from "@/lib/utils";

interface TagSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

function TagSelect({ options, value, onChange, className }: TagSelectProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group">
      {options.map((option) => {
        const selected = value.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
              selected
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export { TagSelect };
