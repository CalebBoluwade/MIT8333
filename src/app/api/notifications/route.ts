import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  const user = await requireUser();
  const data = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(desc(schema.notifications.createdAt), desc(schema.notifications.id))
    .limit(20);
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  return { data, unread };
});

/** Marks all of the signed-in user's notifications as read. */
export const POST = handle(async () => {
  const user = await requireUser();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  return { ok: true };
});
