import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  await requireUser();
  return { data: await db.select().from(schema.categories).orderBy(schema.categories.name) };
});
