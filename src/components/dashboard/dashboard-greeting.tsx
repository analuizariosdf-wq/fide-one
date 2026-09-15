import { formatDateLong } from "@/lib/format";

function getGreeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardGreeting({ name }: { name: string }) {
  const now = new Date();

  return (
    <div className="flex flex-col gap-1">
      <h1>
        {getGreeting(now.getHours())}, {name}
      </h1>
      <p className="text-muted-foreground">{formatDateLong(now)}</p>
    </div>
  );
}
