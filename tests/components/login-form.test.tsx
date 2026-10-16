// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { LoginForm } from "@/components/forms/login-form";
import { toast } from "sonner";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  replace.mockReset();
});
afterEach(cleanup);

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });

describe("LoginForm", () => {
  it("shows validation messages and doesn't call the API when empty", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in and sends the user to their role's home", async () => {
    fetchMock.mockResolvedValue(json(200, { user: { name: "Ade Officer", role: "officer" } }));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "ade@campus.edu");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/officer"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toEqual({ email: "ade@campus.edu", password: "Secret123" });
    expect(toast.success).toHaveBeenCalled();
  });

  it("shows the server's error and stays on the page when sign-in fails", async () => {
    fetchMock.mockResolvedValue(json(401, { error: "Incorrect email or password" }));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "ade@campus.edu");
    await userEvent.type(screen.getByLabelText(/^password$/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Incorrect email or password"));
    expect(replace).not.toHaveBeenCalled();
  });
});
