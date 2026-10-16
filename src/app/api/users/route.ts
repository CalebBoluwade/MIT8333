import { randomUUID } from "node:crypto";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { createUserSchema } from "@/lib/validators";

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  role: z.enum(["student", "staff", "officer", "admin"]).optional(),
});

export const GET = handle(async (req) => {
  await requireUser("admin");
  const raw = Object.fromEntries(new URL(req.url).searchParams);
  for (const k of Object.keys(raw)) if (raw[k] === "") delete raw[k];
  const q = query.parse(raw);

  const where = and(
    q.role ? eq(schema.roles.name, q.role) : undefined,
    q.q ? or(like(schema.users.name, `%${q.q}%`), like(schema.users.email, `%${q.q}%`)) : undefined
  );

  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.roles.name,
      roleLabel: schema.roles.label,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(where)
    .orderBy(desc(schema.users.createdAt))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(where);

  return { data: rows, page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
});

export const POST = handle(async (req) => {
  const admin = await requireUser("admin");
  const input = await parseBody(req, createUserSchema);

  const [exists] = await db.select().from(schema.users).where(eq(schema.users.email, input.email));
  if (exists) {
    throw new ApiError(409, "An account with this email already exists", { email: "This email is already registered" });
  }
  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.name, input.role));
  if (!role) throw new ApiError(500, "Role not found");
  const id = randomUUID();
  await db.insert(schema.users).values({
    id,
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    roleId: role.id,
  });
  await audit(admin.id, "user.create", "user", id, { role: input.role });
  return Response.json({ id }, { status: 201 });
});
