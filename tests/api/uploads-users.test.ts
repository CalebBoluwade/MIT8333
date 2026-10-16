import { beforeAll, describe, expect, it } from "vitest";
import { FormData as UndiciFormData } from "undici";
import { File as NodeFile } from "node:buffer";
import { POST as create } from "@/app/api/requests/route";
import { POST as upload } from "@/app/api/requests/[id]/attachments/route";
import { GET as download } from "@/app/api/attachments/[id]/route";
import { POST as assign } from "@/app/api/requests/[id]/assign/route";
import { GET as listUsers, POST as createUser } from "@/app/api/users/route";
import { PATCH as patchUser } from "@/app/api/users/[id]/route";
import { GET as officers } from "@/app/api/officers/route";
import { GET as audit } from "@/app/api/audit-logs/route";
import { GET as docs } from "@/app/api/docs/route";
import { POST as login } from "@/app/api/auth/login/route";
import { PASSWORD, call, makeUser, signInAs, signOut, validRequestBody, type TestUser } from "../helpers";

let admin: TestUser, officer: TestUser, alice: TestUser, bob: TestUser, rid: number;

const png = (bytes = 64, type = "image/png", name = "fault.png") => {
  const form = new UndiciFormData();
  form.append("file", new NodeFile([new Uint8Array(bytes).fill(1)], name, { type }) as unknown as Blob);
  return form;
};

beforeAll(async () => {
  [admin, officer, alice, bob] = await Promise.all([makeUser("admin"), makeUser("officer"), makeUser("student"), makeUser("student")]);
  await signInAs(alice);
  rid = (await call(create, { method: "POST", body: await validRequestBody() })).body.id;
});

describe("image upload", () => {
  it("accepts a valid image and serves it back to the owner only", async () => {
    await signInAs(alice);
    const up = await call(upload, { method: "POST", params: { id: String(rid) }, form: png() });
    expect(up.status).toBe(201);

    const file = await call(download, { params: { id: up.body.id } });
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("image/png");

    await signInAs(bob);
    expect((await call(download, { params: { id: up.body.id } })).status).toBe(404);
  });

  it("rejects non-images and oversized files", async () => {
    await signInAs(alice);
    const bad = await call(upload, { method: "POST", params: { id: String(rid) }, form: png(10, "application/pdf", "x.pdf") });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/JPG, PNG or WebP/);
    const big = await call(upload, { method: "POST", params: { id: String(rid) }, form: png(1_000_001) });
    expect(big.status).toBe(400);
    expect(big.body.error).toMatch(/too large/i);
  });

  it("caps at three images per request", async () => {
    await signInAs(alice);
    const r = (await call(create, { method: "POST", body: await validRequestBody() })).body.id;
    for (let i = 0; i < 3; i++) expect((await call(upload, { method: "POST", params: { id: String(r) }, form: png() })).status).toBe(201);
    expect((await call(upload, { method: "POST", params: { id: String(r) }, form: png() })).status).toBe(409);
  });

  it("doesn't let someone else's request be touched", async () => {
    await signInAs(bob);
    expect((await call(upload, { method: "POST", params: { id: String(rid) }, form: png() })).status).toBe(404);
  });

  it("doesn't let officers upload evidence", async () => {
    await signInAs(admin);
    await call(assign, { method: "POST", params: { id: String(rid) }, body: { officerId: officer.id } });
    await signInAs(officer);
    expect((await call(upload, { method: "POST", params: { id: String(rid) }, form: png() })).status).toBe(403);
  });
});

describe("user management", () => {
  it("is admin-only", async () => {
    for (const u of [alice, officer]) {
      await signInAs(u);
      expect((await call(listUsers)).status).toBe(403);
      expect((await call(officers)).status).toBe(403);
      expect((await call(audit)).status).toBe(403);
    }
    signOut();
    expect((await call(listUsers)).status).toBe(401);
  });

  it("lists users with search, role filter and no password data", async () => {
    await signInAs(admin);
    const all = await call(listUsers, { url: "/api/users?pageSize=100" });
    expect(all.status).toBe(200);
    expect(JSON.stringify(all.body)).not.toMatch(/passwordHash|password_hash/);
    const onlyOfficers = await call(listUsers, { url: "/api/users?role=officer&pageSize=100" });
    expect(onlyOfficers.body.data.every((u: { role: string }) => u.role === "officer")).toBe(true);
    expect((await call(listUsers, { url: `/api/users?q=${encodeURIComponent(alice.email)}` })).body.total).toBe(1);
  });

  it("creates users with a chosen role, rejecting duplicates and weak passwords", async () => {
    await signInAs(admin);
    const body = { name: "New Officer", email: "new.officer@test.edu", password: "Strong123", role: "officer" };
    expect((await call(createUser, { method: "POST", body })).status).toBe(201);
    expect((await call(createUser, { method: "POST", body })).status).toBe(409);
    expect((await call(createUser, { method: "POST", body: { ...body, email: "x@test.edu", password: "weak" } })).status).toBe(400);
    const list = await call(officers);
    expect(list.body.data.some((o: { email: string }) => o.email === body.email)).toBe(true);
  });

  it("changes roles and deactivates accounts, which then can't sign in", async () => {
    const target = await makeUser("student");
    await signInAs(admin);
    expect((await call(patchUser, { method: "PATCH", params: { id: target.id }, body: { role: "officer" } })).status).toBe(200);
    expect((await call(officers)).body.data.some((o: { id: string }) => o.id === target.id)).toBe(true);

    expect((await call(patchUser, { method: "PATCH", params: { id: target.id }, body: { isActive: false } })).status).toBe(200);
    signOut();
    expect((await call(login, { method: "POST", body: { email: target.email, password: PASSWORD } })).status).toBe(403);
  });

  it("stops an admin locking themselves out", async () => {
    await signInAs(admin);
    expect((await call(patchUser, { method: "PATCH", params: { id: admin.id }, body: { role: "student" } })).status).toBe(409);
    expect((await call(patchUser, { method: "PATCH", params: { id: admin.id }, body: { isActive: false } })).status).toBe(409);
    expect((await call(patchUser, { method: "PATCH", params: { id: "missing" }, body: { isActive: false } })).status).toBe(404);
  });
});

describe("audit trail and docs", () => {
  it("records who did what", async () => {
    await signInAs(admin);
    const res = await call(audit);
    expect(res.status).toBe(200);
    const actions = res.body.data.map((a: { action: string }) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["request.create", "request.assign", "user.create", "user.update"]));
  });

  it("serves a valid OpenAPI document without a session", async () => {
    signOut();
    const res = await call(async () => docs());
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toContain("/api/requests/{id}/assign");
  });
});
