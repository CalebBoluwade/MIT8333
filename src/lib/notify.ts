import { db, schema } from "@/db";

export async function notify(userId: string, message: string, requestId?: number) {
  await db.insert(schema.notifications).values({
    userId,
    message,
    requestId: requestId ?? null,
  });
}
