// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RegisterForm } from "@/components/forms/register-form";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  replace.mockReset();
});
afterEach(cleanup);

async function fill(over: Partial<Record<"name" | "email" | "password" | "confirm", string>> = {}) {
  const v = { name: "Tola Student", email: "tola@campus.edu", password: "Secret123", confirm: "Secret123", ...over };
  await userEvent.type(screen.getByLabelText(/full name/i), v.name);
  await userEvent.type(screen.getByLabelText(/^email/i), v.email);
  await userEvent.type(screen.getByLabelText(/^password/i), v.password);
  await userEvent.type(screen.getByLabelText(/confirm password/i), v.confirm);
  await userEvent.click(screen.getByRole("button", { name: /create account/i }));
}

describe("RegisterForm", () => {
  it("catches a password mismatch before calling the API", async () => {
    render(<RegisterForm />);
    await fill({ confirm: "Different1" });
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("puts a server-side duplicate-email error on the email field", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "An account with this email already exists", fields: { email: "This email is already registered" } }) });
    render(<RegisterForm />);
    await fill();
    expect(await screen.findByRole("alert")).toHaveTextContent(/already registered/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it("goes to the dashboard after a successful sign-up", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ user: {} }) });
    render(<RegisterForm />);
    await fill();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
