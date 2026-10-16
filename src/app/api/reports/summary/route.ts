import { count, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  const user = await requireUser("admin", "officer");
  const sr = schema.serviceRequests;

  const byStatus = await db.select({ status: sr.status, n: count() }).from(sr).groupBy(sr.status);
  const byCategory = await db
    .select({ category: schema.categories.name, n: count() })
    .from(sr)
    .innerJoin(schema.categories, eq(schema.categories.id, sr.categoryId))
    .groupBy(schema.categories.name);
  const [{ avgHours }] = await db
    .select({ avgHours: sql<number | null>`avg(${sr.completedAt} - ${sr.createdAt}) / 3600.0` })
    .from(sr)
    .where(eq(sr.status, "completed"));

  void user;
  return {
    total: byStatus.reduce((a, b) => a + b.n, 0),
    byStatus,
    byCategory,
    avgResolutionHours: avgHours === null ? null : Math.round(avgHours * 10) / 10,
  };
});
