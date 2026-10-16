import { and, count, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SessionUser } from "@/lib/jwt";
import type { RequestStatus } from "@/db/schema";

/** Counts of requests per status, limited to what the user is allowed to see. */
export async function statusCounts(user: SessionUser) {
  const sr = schema.serviceRequests;
  const joinActive = and(eq(schema.assignments.requestId, sr.id), eq(schema.assignments.active, true));
  const scope =
    user.role === "student" || user.role === "staff"
      ? eq(sr.requesterId, user.id)
      : user.role === "officer"
        ? eq(schema.assignments.officerId, user.id)
        : undefined;

  const rows = await db
    .select({ status: sr.status, n: count() })
    .from(sr)
    .leftJoin(schema.assignments, joinActive)
    .where(scope)
    .groupBy(sr.status);

  const out: Record<RequestStatus, number> = {
    pending: 0, assigned: 0, in_progress: 0, completed: 0, rejected: 0, cancelled: 0,
  };
  for (const r of rows) out[r.status] = r.n;
  const total = Object.values(out).reduce((a, b) => a + b, 0);
  return { ...out, total };
}

export async function adminSummary() {
  const sr = schema.serviceRequests;
  const byCategory = await db
    .select({ category: schema.categories.name, n: count() })
    .from(sr)
    .innerJoin(schema.categories, eq(schema.categories.id, sr.categoryId))
    .groupBy(schema.categories.name)
    .orderBy(sql`count(*) desc`);
  const [{ avgHours }] = await db
    .select({ avgHours: sql<number | null>`avg(${sr.completedAt} - ${sr.createdAt}) / 3600.0` })
    .from(sr)
    .where(eq(sr.status, "completed"));
  return { byCategory, avgHours: avgHours === null ? null : Math.round(avgHours * 10) / 10 };
}
