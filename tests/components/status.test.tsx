// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatusBadge, StatusRail } from "@/components/status";

afterEach(cleanup);

describe("StatusRail", () => {
  it("marks the current step and completed steps", () => {
    render(<StatusRail status="in_progress" />);
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(steps[2]).toHaveAttribute("aria-current", "step");
    expect(steps[0]).not.toHaveAttribute("aria-current");
  });

  it("has no active step once completed", () => {
    render(<StatusRail status="completed" />);
    expect(screen.getAllByRole("listitem").some((li) => li.getAttribute("aria-current"))).toBe(false);
  });

  it("replaces the rail with a plain message when rejected or cancelled", () => {
    render(<StatusRail status="rejected" />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("shows a human label", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
