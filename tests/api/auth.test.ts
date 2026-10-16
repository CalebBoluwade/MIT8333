import { beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { PASSWORD, call, makeUser, signOut } from "../helpers";
import { jar } from "../cookie-jar";
import { SESSION_COOKIE } from "@/lib/jwt";

beforeEach(() => signOut());

describe("POST /api/auth/register", () => {
  const body = { name: "Tola Student", email: "tola@test.edu", password: "Secret123", confirmPassword: "Secret123" };

  it("creates a student/staff account, signs them in, and never returns the hash", async () => {
    const res = await call(register, { method: "POST", body });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("student");
    expect(JSON.stringify(res.body)).not.toMatch(/hash|Secret123/i);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
  });

  it("rejects a duplicate email with a field error", async () => {
    const res = await call(register, { method: "POST", body });
    expect(res.status).toBe(409);
    expect(res.body.fields.email).toMatch(/already registered/i);
  });

  it("validates input", async () => {
    const res = await call(register, { method: "POST", body: { name: "A", email: "nope", password: "short", confirmPassword: "x" } });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(["name", "email", "password", "confirmPassword"]));
  });

  it("rejects malformed JSON", async () => {
    const res = await register(new Request("http://t", { method: "POST", body: "{oops" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("signs in with correct credentials and sets a session", async () => {
    const u = await makeUser("student");
    const res = await call(login, { method: "POST", body: { email: u.email, password: PASSWORD } });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: u.id, role: "student" });
    expect(jar.has(SESSION_COOKIE)).toBe(true);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const u = await makeUser("student");
    const wrong = await call(login, { method: "POST", body: { email: u.email, password: "Wrong123" } });
    const unknown = await call(login, { method: "POST", body: { email: "ghost@test.edu", password: PASSWORD } });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it("blocks deactivated accounts", async () => {
    const u = await makeUser("student", { isActive: false });
    const res = await call(login, { method: "POST", body: { email: u.email, password: PASSWORD } });
    expect(res.status).toBe(403);
  });
});

describe("session", () => {
  it("/me needs a session, and logout clears it", async () => {
    expect((await call(me)).status).toBe(401);
    const u = await makeUser("officer");
    await call(login, { method: "POST", body: { email: u.email, password: PASSWORD } });
    const res = await call(me);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("officer");
    await call(logout, { method: "POST" });
    expect((await call(me)).status).toBe(401);
  });

  it("rejects a tampered token", async () => {
    jar.set(SESSION_COOKIE, "not.a.jwt");
    expect((await call(me)).status).toBe(401);
  });
});
