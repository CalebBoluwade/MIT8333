import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const ACCENT: Record<string, { bar: string; icon: string; bg: string }> = {
  indigo:  { bar: "bg-indigo-500",  icon: "text-indigo-500",  bg: "bg-indigo-50" },
  emerald: { bar: "bg-emerald-500", icon: "text-emerald-500", bg: "bg-emerald-50" },
  amber:   { bar: "bg-amber-500",   icon: "text-amber-500",   bg: "bg-amber-50" },
  sky:     { bar: "bg-sky-500",     icon: "text-sky-500",     bg: "bg-sky-50" },
  violet:  { bar: "bg-violet-500",  icon: "text-violet-500",  bg: "bg-violet-50" },
};

export function StatCard({
  label,
  value,
  hint,
  accent = "indigo",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "sky" | "violet";
  icon?: LucideIcon;
}) {
  const a = ACCENT[accent];
  return (
    <Card className="overflow-hidden p-0">
      <div className={`h-0.5 w-full ${a.bar}`} />
      <div className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="num mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${a.bg}`}>
            <Icon className={`size-4.5 ${a.icon}`} aria-hidden />
          </span>
        )}
      </div>
    </Card>
  );
}
