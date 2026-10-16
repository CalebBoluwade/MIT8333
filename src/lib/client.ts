/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed fetch helpers; callers pass generics where it matters */
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export async function api<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ClientApiError(
      res.status,
      data?.error ?? "Something went wrong. Try again.",
      data?.fields
    );
  }
  return data as T;
}

export const post = <T = any>(url: string, body?: unknown) =>
  api<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

/** Copies field-level server errors onto a react-hook-form instance. */
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>
) {
  if (err instanceof ClientApiError && err.fields) {
    for (const [name, message] of Object.entries(err.fields)) {
      setError(name as Path<T>, { type: "server", message });
    }
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Try again.";
