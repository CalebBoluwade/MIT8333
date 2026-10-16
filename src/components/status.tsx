import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Priority, RequestStatus } from "@/db/schema";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";

const STATUS_TONE = {
  pending: "amber", assigned: "blue", in_progress: "violet",
  completed: "green", rejected: "red", cancelled: "neutral",
} as const;

const PRIORITY_TONE = {
  low: "neutral", medium: "blue", high: "orange", urgent: "red",
} as const;

export const StatusBadge = ({ status }: { status: RequestStatus }) => (
  <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABELS[priority]}</Badge>
);

const STEPS = ["pending", "assigned", "in_progress", "completed"] as const;

export function StatusRail({ status }: { status: RequestStatus }) {
  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">×</span>
        <p className="text-sm text-red-700">
          This request was <strong>{STATUS_LABELS[status].toLowerCase()}</strong>. See the history below for details.
        </p>
      </div>
    );
  }

  const current = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <ol className="flex items-start" aria-label="Request progress">
      {STEPS.map((step, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";
        return (
          <li key={step} aria-current={active ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-1/2 top-[15px] h-0.5 w-full transition-colors duration-500",
                  i <= current || status === "completed" ? "bg-indigo-500" : "bg-border"
                )}
              />
            )}
            <span
              style={
                done
                  ? { background: "#4f46e5", color: "#fff", boxShadow: "0 2px 8px rgba(79,70,229,0.4)" }
                  : active
                  ? { border: "2px solid #4f46e5", color: "#4f46e5", background: "#fff", boxShadow: "0 0 0 4px rgba(79,70,229,0.12)" }
                  : {}
              }
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                !done && !active && "border-2 border-border bg-card text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn(
              "text-xs leading-tight",
              done && "font-medium text-indigo-600",
              active && "font-semibold text-foreground",
              !done && !active && "text-muted-foreground"
            )}>
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
