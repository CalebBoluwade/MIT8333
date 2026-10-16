import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseId, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { isClosed } from "@/lib/status";

export const POST = handle(async (_req, { params }) => {
  const officer = await requireUser("officer");
  const id = parseId((await params).id);

  const [request] = await db
    .select({
      id: schema.serviceRequests.id,
      title: schema.serviceRequests.title,
      status: schema.serviceRequests.status,
      requesterId: schema.serviceRequests.requesterId,
    })
    .from(schema.serviceRequests)
    .where(eq(schema.serviceRequests.id, id))
    .limit(1);

  if (!request) throw new ApiError(404, "Request not found");
  if (isClosed(request.status)) throw new ApiError(409, "This request is closed");
  if (request.status !== "pending") throw new ApiError(409, "Only pending requests can be picked up");

  // Check no active assignment already exists
  const [existing] = await db
    .select({ id: schema.assignments.id })
    .from(schema.assignments)
    .where(and(eq(schema.assignments.requestId, id), eq(schema.assignments.active, true)))
    .limit(1);
  if (existing) throw new ApiError(409, "This request has already been assigned");

  await db.transaction(async (tx) => {
    await tx.insert(schema.assignments).values({
      requestId: id,
      officerId: officer.id,
      assignedById: officer.id,
    });
    await tx
      .update(schema.serviceRequests)
      .set({ status: "assigned", updatedAt: new Date() })
      .where(eq(schema.serviceRequests.id, id));
    await tx.insert(schema.statusLogs).values({
      requestId: id,
      fromStatus: "pending",
      toStatus: "assigned",
      note: `Picked up by ${officer.name}`,
      changedById: officer.id,
    });
  });

  await notify(request.requesterId, `Request #${id} was picked up by ${officer.name}`, id);
  await audit(officer.id, "request.pickup", "request", id, { officerId: officer.id });
  return { ok: true };
});
