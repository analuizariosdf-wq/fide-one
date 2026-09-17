import { Progress } from "@/components/ui/progress";

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  displayValue: string;
}

/**
 * A single labeled bar — used instead of pulling in a charting library
 * for the handful of simple comparisons this module needs (receita por
 * cliente, carga por responsável, tarefas por status).
 */
export function BarRow({ label, value, maxValue, displayValue }: BarRowProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-[13px] text-foreground" title={label}>
        {label}
      </span>
      <Progress value={percentage} className="flex-1" />
      <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">{displayValue}</span>
    </div>
  );
}
