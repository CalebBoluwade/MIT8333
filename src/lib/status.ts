import type { RequestStatus, RoleName } from "@/db/schema";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
} as const;

/** Which statuses each role may move a request to, from a given status. */
const TRANSITIONS: Record<RoleName, Partial<Record<RequestStatus, RequestStatus[]>>> = {
  student: {
    pending: ["cancelled"],
  },
  staff: {
    pending: ["cancelled"],
  },
  officer: {
    assigned: ["in_progress"],
    in_progress: ["completed"],
  },
  admin: {
    pending: ["rejected", "cancelled"],
    assigned: ["rejected", "cancelled"],
    in_progress: ["completed", "cancelled"],
  },
};

export function allowedTransitions(role: RoleName, from: RequestStatus): RequestStatus[] {
  return TRANSITIONS[role][from] ?? [];
}

export function canTransition(role: RoleName, from: RequestStatus, to: RequestStatus) {
  return allowedTransitions(role, from).includes(to);
}

export const CLOSED_STATUSES: RequestStatus[] = ["completed", "rejected", "cancelled"];
export const isClosed = (s: RequestStatus) => CLOSED_STATUSES.includes(s);
