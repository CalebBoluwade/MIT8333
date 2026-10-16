import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody, parseId, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getScopedRequest } from "@/lib/requests";
import { isClosed } from "@/lib/status";
import { assignSchema } from "@/lib/validators";

export const POST = handle(async (req, { params }) => {
  const admin = await requireUser("admin");
  const id = parseId((await params).id);
  const input = await parseBody(req, assignSchema);

  const request = await getScopedRequest(admin, id);
  if (!request) throw new ApiError(404, "Request not found");
  if (isClosed(request.status)) throw new ApiError(409, "This request is closed and can't be assigned");

  const [officer] = await db
    .select({ id: schema.users.id, name: schema.users.name, isActive: schema.users.isActive })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(and(eq(schema.users.id, input.officerId), eq(schema.roles.name, "officer")));
  if (!officer || !officer.isActive) {
    throw new ApiError(400, "Choose an active maintenance officer", { officerId: "Choose an active maintenance officer" });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.assignments)
      .set({ active: false })
      .where(eq(schema.assignments.requestId, id));
    await tx.insert(schema.assignments).values({
      requestId: id,
      officerId: officer.id,
      assignedById: admin.id,
      note: input.note,
    });
    if (request.status !== "assigned") {
      await tx
        .update(schema.serviceRequests)
        .set({ status: "assigned", updatedAt: new Date() })
        .where(eq(schema.serviceRequests.id, id));
      await tx.insert(schema.statusLogs).values({
        requestId: id,
        fromStatus: request.status,
        toStatus: "assigned",
        note: `Assigned to ${officer.name}${input.note ? `: ${input.note}` : ""}`,
        changedById: admin.id,
      });
    } else {
      await tx.insert(schema.statusLogs).values({
        requestId: id,
        fromStatus: "assigned",
        toStatus: "assigned",
        note: `Reassigned to ${officer.name}`,
        changedById: admin.id,
      });
    }
  });

  await notify(officer.id, `You were assigned request #${id}: ${request.title}`, id);
  await notify(request.requesterId, `Request #${id} was assigned to ${officer.name}`, id);
  await audit(admin.id, "request.assign", "request", id, { officerId: officer.id });
  return { ok: true, officer: { id: officer.id, name: officer.name } };
});
