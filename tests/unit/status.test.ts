import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, isClosed } from "@/lib/status";

describe("status transitions", () => {
  it("lets officers move only assigned → in progress → completed", () => {
    expect(allowedTransitions("officer", "assigned")).toEqual(["in_progress"]);
    expect(allowedTransitions("officer", "in_progress")).toEqual(["completed"]);
    expect(canTransition("officer", "pending", "completed")).toBe(false);
    expect(canTransition("officer", "completed", "in_progress")).toBe(false);
  });

  it("lets students cancel only pending requests", () => {
    expect(canTransition("student", "pending", "cancelled")).toBe(true);
    expect(canTransition("student", "in_progress", "cancelled")).toBe(false);
    expect(canTransition("student", "pending", "completed")).toBe(false);
  });

  it("gives admins no way to reopen closed requests", () => {
    for (const s of ["completed", "rejected", "cancelled"] as const) {
      expect(allowedTransitions("admin", s)).toEqual([]);
      expect(isClosed(s)).toBe(true);
    }
  });
});
