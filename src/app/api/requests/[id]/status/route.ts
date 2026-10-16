import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody, parseId, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getScopedRequest } from "@/lib/requests";
import { STATUS_LABELS, canTransition } from "@/lib/status";
import { statusUpdateSchema } from "@/lib/validators";

export const POST = handle(async (req, { params }) => {
  const user = await requireUser();
  const id = parseId((await params).id);
  const { status, note } = await parseBody(req, statusUpdateSchema);

  // Scoping means officers only reach their own jobs and requesters only their own requests.
  const request = await getScopedRequest(user, id);
  if (!request) throw new ApiError(404, "Request not found");

  if (status === "in_progress" && request.officerId !== user.id) {
    throw new ApiError(403, "Only the assigned officer can move a request to in progress");
  }

  if (!canTransition(user.role, request.status, status)) {
    throw new ApiError(
      409,
      `A ${STATUS_LABELS[request.status].toLowerCase()} request can't be moved to ${STATUS_LABELS[status].toLowerCase()}`
    );
  }
  if (status === "rejected" && !note) {
    throw new ApiError(400, "Say why the request is being rejected", { note: "A reason is required when rejecting" });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.serviceRequests)
      .set({
        status,
        updatedAt: now,
        completedAt: status === "completed" ? now : request.completedAt,
      })
      .where(eq(schema.serviceRequests.id, id));
    await tx.insert(schema.statusLogs).values({
      requestId: id,
      fromStatus: request.status,
      toStatus: status,
      note: note ?? null,
      changedById: user.id,
    });
  });

  if (request.requesterId !== user.id) {
    await notify(
      request.requesterId,
      `Request #${id} is now ${STATUS_LABELS[status].toLowerCase()}`,
      id
    );
  }
  await audit(user.id, "request.status", "request", id, { from: request.status, to: status });
  return { ok: true, status };
});
