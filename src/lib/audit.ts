import { db, schema } from "@/db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | number,
  meta?: Record<string, unknown>
) {
  await db.insert(schema.auditLogs).values({
    actorId,
    action,
    entity,
    entityId: entityId === undefined ? null : String(entityId),
    meta: meta ? JSON.stringify(meta) : null,
  });
}
