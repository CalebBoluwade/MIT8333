import { randomUUID } from "node:crypto";
import { FormData as UndiciFormData, Request as UndiciRequest, type RequestInit as UndiciRequestInit } from "undici";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { RoleName } from "@/db/schema";
import { signSession, SESSION_COOKIE } from "@/lib/jwt";
import { jar } from "./cookie-jar";

export const PASSWORD = "Passw0rd!";
let counter = 0;

export async function makeUser(role: RoleName, overrides: Partial<{ name: string; email: string; isActive: boolean }> = {}) {
  const [r] = await db.select().from(schema.roles).where(eq(schema.roles.name, role));
  const id = randomUUID();
  const email = overrides.email ?? `${role}-${++counter}-${id.slice(0, 6)}@test.edu`;
  const name = overrides.name ?? `${role} ${counter}`;
  await db.insert(schema.users).values({
    id,
    name,
    email,
    passwordHash: await bcrypt.hash(PASSWORD, 4),
    roleId: r.id,
    isActive: overrides.isActive ?? true,
  });
  return { id, name, email, role };
}
export type TestUser = Awaited<ReturnType<typeof makeUser>>;

export async function signInAs(user: TestUser) {
  jar.set(SESSION_COOKIE, await signSession(user));
}
export const signOut = () => jar.clear();

export type { UndiciFormData };

/** Calls a route handler directly and returns the status and parsed body. */
export async function call(
  handler: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
  opts: { method?: string; url?: string; body?: unknown; form?: UndiciFormData; params?: Record<string, string> } = {}
) {
  const init: UndiciRequestInit = { method: opts.method ?? "GET" };
  if (opts.form) init.body = opts.form as unknown as UndiciRequestInit["body"];
  else if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "Content-Type": "application/json" };
  }
  const res = await handler(new UndiciRequest(`http://test${opts.url ?? "/api"}`, init) as unknown as Request, {
    params: Promise.resolve(opts.params ?? {}),
  });
  const type = res.headers.get("content-type") ?? "";
  const body = type.includes("json") ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

export async function categoryId(name = "Electrical") {
  const [c] = await db.select().from(schema.categories).where(eq(schema.categories.name, name));
  return c.id;
}

export async function validRequestBody(over: Record<string, unknown> = {}) {
  return {
    title: "Ceiling light out in Lab 3",
    description: "The main light has not worked since Monday.",
    location: "Science Block, Lab 3",
    categoryId: await categoryId(),
    priority: "medium",
    ...over,
  };
}
