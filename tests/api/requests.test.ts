import { beforeAll, describe, expect, it } from "vitest";
import { GET as list, POST as create } from "@/app/api/requests/route";
import { GET as detail, PATCH as edit, DELETE as remove } from "@/app/api/requests/[id]/route";
import { POST as assign } from "@/app/api/requests/[id]/assign/route";
import { POST as setStatus } from "@/app/api/requests/[id]/status/route";
import { GET as exportCsv } from "@/app/api/reports/export/route";
import { GET as summary } from "@/app/api/reports/summary/route";
import { GET as notifications } from "@/app/api/notifications/route";
import { call, makeUser, signInAs, signOut, validRequestBody, type TestUser } from "../helpers";

let admin: TestUser, officer: TestUser, officer2: TestUser, alice: TestUser, bob: TestUser;

beforeAll(async () => {
  [admin, officer, officer2, alice, bob] = await Promise.all([
    makeUser("admin"), makeUser("officer"), makeUser("officer"), makeUser("student"), makeUser("student"),
  ]);
});

async function submit(as: TestUser, over: Record<string, unknown> = {}) {
  await signInAs(as);
  const res = await call(create, { method: "POST", body: await validRequestBody(over) });
  expect(res.status).toBe(201);
  return res.body.id as number;
}
const id = (n: number) => ({ id: String(n) });

describe("creating requests", () => {
  it("requires sign-in", async () => {
    signOut();
    expect((await call(create, { method: "POST", body: await validRequestBody() })).status).toBe(401);
  });

  it("creates a pending request with a first log entry and notifies admins", async () => {
    const rid = await submit(alice);
    await signInAs(alice);
    const d = await call(detail, { params: id(rid) });
    expect(d.body.status).toBe("pending");
    expect(d.body.logs).toHaveLength(1);
    expect(d.body.logs[0]).toMatchObject({ toStatus: "pending", changedByName: alice.name });

    await signInAs(admin);
    const n = await call(notifications);
    expect(n.body.data.some((x: { requestId: number }) => x.requestId === rid)).toBe(true);
  });

  it("validates fields and reports which ones are wrong", async () => {
    await signInAs(alice);
    const res = await call(create, { method: "POST", body: await validRequestBody({ title: "hi", priority: "asap", categoryId: 0 }) });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(["title", "priority", "categoryId"]));
  });
});

describe("role-based access", () => {
  it("students only see their own requests", async () => {
    const rid = await submit(alice);
    await signInAs(bob);
    expect((await call(detail, { params: id(rid) })).status).toBe(404);
    const mine = await call(list, { url: "/api/requests" });
    expect(mine.body.data.every((r: { requesterId: string }) => r.requesterId === bob.id)).toBe(true);
  });

  it("only admins can assign, delete or list-all", async () => {
    const rid = await submit(alice);
    for (const u of [alice, officer]) {
      await signInAs(u);
      expect((await call(assign, { method: "POST", params: id(rid), body: { officerId: officer.id } })).status).toBe(403);
      expect((await call(remove, { method: "DELETE", params: id(rid) })).status).toBe(403);
    }
  });

  it("only the owner (while pending) or an admin can edit", async () => {
    const rid = await submit(alice);
    await signInAs(bob);
    expect((await call(edit, { method: "PATCH", params: id(rid), body: { title: "Hijacked title" } })).status).toBe(404);
    await signInAs(alice);
    expect((await call(edit, { method: "PATCH", params: id(rid), body: { title: "Updated title here" } })).status).toBe(200);
    await signInAs(admin);
    await call(assign, { method: "POST", params: id(rid), body: { officerId: officer.id } });
    await signInAs(alice);
    expect((await call(edit, { method: "PATCH", params: id(rid), body: { title: "Too late to edit" } })).status).toBe(409);
  });
});

describe("assignment and workflow", () => {
  it("runs the full lifecycle pending → assigned → in progress → completed", async () => {
    const rid = await submit(alice);

    await signInAs(admin);
    const a = await call(assign, { method: "POST", params: id(rid), body: { officerId: officer.id, note: "Bring a ladder" } });
    expect(a.status).toBe(200);

    // Visible to the assigned officer only.
    await signInAs(officer2);
    expect((await call(detail, { params: id(rid) })).status).toBe(404);
    await signInAs(officer);
    expect((await call(detail, { params: id(rid) })).body.officerName).toBe(officer.name);
    expect((await call(list, { url: "/api/requests" })).body.data.map((r: { id: number }) => r.id)).toContain(rid);

    // Can't skip a step.
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "completed" } })).status).toBe(409);

    await signInAs(admin);
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "in_progress", note: "Admin override" } })).status).toBe(403);

    await signInAs(officer);
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "in_progress", note: "On site" } })).status).toBe(200);
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "completed", note: "Replaced the tube" } })).status).toBe(200);

    await signInAs(alice);
    const d = await call(detail, { params: id(rid) });
    expect(d.body.status).toBe("completed");
    expect(d.body.completedAt).toBeTruthy();
    expect(d.body.logs.map((l: { toStatus: string }) => l.toStatus)).toEqual(["pending", "assigned", "in_progress", "completed"]);
    const n = await call(notifications);
    expect(n.body.data.some((x: { message: string }) => /completed/i.test(x.message))).toBe(true);

    // A finished job can't be reopened by the officer.
    await signInAs(officer);
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "in_progress" } })).status).toBe(409);
  });

  it("reassigning keeps history and moves the job to the new officer", async () => {
    const rid = await submit(alice);
    await signInAs(admin);
    await call(assign, { method: "POST", params: id(rid), body: { officerId: officer.id } });
    await call(assign, { method: "POST", params: id(rid), body: { officerId: officer2.id } });
    await signInAs(officer);
    expect((await call(detail, { params: id(rid) })).status).toBe(404);
    await signInAs(officer2);
    expect((await call(detail, { params: id(rid) })).status).toBe(200);
  });

  it("refuses to assign to a non-officer or a missing user", async () => {
    const rid = await submit(alice);
    await signInAs(admin);
    for (const officerId of [bob.id, "no-such-user"]) {
      const res = await call(assign, { method: "POST", params: id(rid), body: { officerId } });
      expect(res.status).toBe(400);
      expect(res.body.fields.officerId).toBeTruthy();
    }
  });

  it("requires a reason to reject", async () => {
    const rid = await submit(alice);
    await signInAs(admin);
    const noNote = await call(setStatus, { method: "POST", params: id(rid), body: { status: "rejected" } });
    expect(noNote.status).toBe(400);
    expect(noNote.body.fields.note).toBeTruthy();
    expect((await call(setStatus, { method: "POST", params: id(rid), body: { status: "rejected", note: "Duplicate of #1" } })).status).toBe(200);
  });

  it("lets students cancel only while pending", async () => {
    const pending = await submit(alice);
    await signInAs(alice);
    expect((await call(setStatus, { method: "POST", params: id(pending), body: { status: "cancelled" } })).status).toBe(200);

    const busy = await submit(alice);
    await signInAs(admin);
    await call(assign, { method: "POST", params: id(busy), body: { officerId: officer.id } });
    await signInAs(alice);
    expect((await call(setStatus, { method: "POST", params: id(busy), body: { status: "cancelled" } })).status).toBe(409);
  });

  it("rejects bad ids", async () => {
    await signInAs(admin);
    expect((await call(detail, { params: { id: "abc" } })).status).toBe(400);
    expect((await call(detail, { params: { id: "999999" } })).status).toBe(404);
  });
});

describe("search, filter and pagination", () => {
  it("paginates and filters a user's list", async () => {
    const carol = await makeUser("student");
    for (let i = 0; i < 12; i++) {
      await submit(carol, {
        title: `Leaking tap number ${i}`,
        priority: i % 4 === 0 ? "urgent" : "low",
        location: i === 3 ? "Hostel B, Room 12" : "Library",
      });
    }
    await signInAs(carol);

    const p1 = await call(list, { url: "/api/requests?page=1&pageSize=5" });
    expect(p1.body).toMatchObject({ total: 12, totalPages: 3, page: 1 });
    expect(p1.body.data).toHaveLength(5);
    expect((await call(list, { url: "/api/requests?page=3&pageSize=5" })).body.data).toHaveLength(2);

    expect((await call(list, { url: "/api/requests?priority=urgent" })).body.total).toBe(3);
    expect((await call(list, { url: "/api/requests?q=Hostel" })).body.total).toBe(1);
    expect((await call(list, { url: "/api/requests?q=tap&status=assigned" })).body.total).toBe(0);
    // Empty filter values behave as "no filter".
    expect((await call(list, { url: "/api/requests?q=&status=" })).body.total).toBe(12);
  });

  it("rejects out-of-range paging", async () => {
    await signInAs(alice);
    expect((await call(list, { url: "/api/requests?pageSize=1000" })).status).toBe(400);
    expect((await call(list, { url: "/api/requests?status=bogus" })).status).toBe(400);
  });
});

describe("reports", () => {
  it("exports CSV for admins only and neutralises spreadsheet formulas", async () => {
    await submit(alice, { title: '=HYPERLINK("http://evil","click")' });
    await signInAs(alice);
    expect((await call(exportCsv)).status).toBe(403);

    await signInAs(admin);
    const res = await call(exportCsv);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    expect(res.body.split("\r\n")[0]).toContain('"Title"');
    expect(res.body).toContain(`"'=HYPERLINK`);
    expect(res.body).not.toMatch(/,"=HYPERLINK/);
  });

  it("summarises counts by status for admins", async () => {
    await signInAs(admin);
    const res = await call(summary);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.byStatus.length).toBeGreaterThan(0);
    await signInAs(alice);
    expect((await call(summary)).status).toBe(403);
  });
});

describe("deleting", () => {
  it("lets an admin delete a request and its history", async () => {
    const rid = await submit(alice);
    await signInAs(admin);
    expect((await call(remove, { method: "DELETE", params: id(rid) })).status).toBe(200);
    expect((await call(detail, { params: id(rid) })).status).toBe(404);
  });
});
