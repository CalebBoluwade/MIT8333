import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  await requireUser("admin");
  const data = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(and(eq(schema.roles.name, "officer"), eq(schema.users.isActive, true)))
    .orderBy(schema.users.name);
  return { data };
});
