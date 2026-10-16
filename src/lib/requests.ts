import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, schema } from "@/db";
import type { SessionUser } from "@/lib/auth";
import type { z } from "zod";
import type { listQuerySchema } from "@/lib/validators";

export type ListQuery = z.infer<typeof listQuerySchema>;

const { serviceRequests: sr, categories, users, assignments } = schema;
const requester = alias(users, "requester");
const officer = alias(users, "officer");

const columns = {
  id: sr.id,
  title: sr.title,
  description: sr.description,
  location: sr.location,
  priority: sr.priority,
  status: sr.status,
  categoryId: sr.categoryId,
  categoryName: categories.name,
  requesterId: sr.requesterId,
  requesterName: requester.name,
  officerId: assignments.officerId,
  officerName: officer.name,
  createdAt: sr.createdAt,
  updatedAt: sr.updatedAt,
  completedAt: sr.completedAt,
};

function scopeConditions(user: SessionUser, f: Partial<ListQuery>) {
  const conds: SQL[] = [];
  if (user.role === "student" || user.role === "staff") conds.push(eq(sr.requesterId, user.id));
  if (user.role === "officer") conds.push(or(eq(assignments.officerId, user.id), eq(sr.status, "pending"))!);
  if (f.status) conds.push(eq(sr.status, f.status));
  if (f.priority) conds.push(eq(sr.priority, f.priority));
  if (f.categoryId) conds.push(eq(sr.categoryId, f.categoryId));
  if (f.officerId && user.role === "admin") conds.push(eq(assignments.officerId, f.officerId));
  if (f.q) {
    const term = `%${f.q}%`;
    const parts: (SQL | undefined)[] = [
      like(sr.title, term),
      like(sr.description, term),
      like(sr.location, term),
    ];
    if (/^\d+$/.test(f.q)) parts.push(eq(sr.id, Number(f.q)));
    conds.push(or(...parts)!);
  }
  return conds;
}

export async function queryRequests(
  user: SessionUser,
  f: Partial<ListQuery>,
  opts: { limit: number; offset: number }
) {
  const where = and(...scopeConditions(user, f));
  const joinActive = and(eq(assignments.requestId, sr.id), eq(assignments.active, true));

  const rows = await db
    .select(columns)
    .from(sr)
    .innerJoin(categories, eq(categories.id, sr.categoryId))
    .innerJoin(requester, eq(requester.id, sr.requesterId))
    .leftJoin(assignments, joinActive)
    .leftJoin(officer, eq(officer.id, assignments.officerId))
    .where(where)
    .orderBy(desc(sr.createdAt), desc(sr.id))
    .limit(opts.limit)
    .offset(opts.offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(sr)
    .leftJoin(assignments, joinActive)
    .where(where);

  return { rows, total };
}

export async function listRequests(user: SessionUser, q: ListQuery) {
  const { rows, total } = await queryRequests(user, q, {
    limit: q.pageSize,
    offset: (q.page - 1) * q.pageSize,
  });
  return {
    data: rows,
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

/** Returns a request only if the user is allowed to see it, otherwise null. */
export async function getScopedRequest(user: SessionUser, id: number) {
  const joinActive = and(eq(assignments.requestId, sr.id), eq(assignments.active, true));
  const conds: SQL[] = [eq(sr.id, id)];
  if (user.role === "student" || user.role === "staff") conds.push(eq(sr.requesterId, user.id));
  if (user.role === "officer") conds.push(or(eq(assignments.officerId, user.id), eq(sr.status, "pending"))!);

  const [row] = await db
    .select(columns)
    .from(sr)
    .innerJoin(categories, eq(categories.id, sr.categoryId))
    .innerJoin(requester, eq(requester.id, sr.requesterId))
    .leftJoin(assignments, joinActive)
    .leftJoin(officer, eq(officer.id, assignments.officerId))
    .where(and(...conds))
    .limit(1);
  return row ?? null;
}

export async function getRequestDetail(user: SessionUser, id: number) {
  const row = await getScopedRequest(user, id);
  if (!row) return null;

  const changer = alias(users, "changer");
  const logs = await db
    .select({
      id: schema.statusLogs.id,
      fromStatus: schema.statusLogs.fromStatus,
      toStatus: schema.statusLogs.toStatus,
      note: schema.statusLogs.note,
      changedByName: changer.name,
      createdAt: schema.statusLogs.createdAt,
    })
    .from(schema.statusLogs)
    .innerJoin(changer, eq(changer.id, schema.statusLogs.changedById))
    .where(eq(schema.statusLogs.requestId, id))
    .orderBy(schema.statusLogs.createdAt, schema.statusLogs.id);

  const files = await db
    .select({
      id: schema.attachments.id,
      fileName: schema.attachments.fileName,
      mimeType: schema.attachments.mimeType,
      size: schema.attachments.size,
    })
    .from(schema.attachments)
    .where(eq(schema.attachments.requestId, id));

  return { ...row, logs, attachments: files };
}
