import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/api";

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = handle(async (req) => {
  await requireUser("admin");
  const q = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const data = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      entity: schema.auditLogs.entity,
      entityId: schema.auditLogs.entityId,
      meta: schema.auditLogs.meta,
      actorName: schema.users.name,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorId))
    .orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);
  const [{ total }] = await db.select({ total: count() }).from(schema.auditLogs);
  return { data, page: q.page, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
});
