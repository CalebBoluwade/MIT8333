import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody, parseId, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getRequestDetail, getScopedRequest } from "@/lib/requests";
import { updateRequestSchema } from "@/lib/validators";

export const GET = handle(async (_req, { params }) => {
  const user = await requireUser();
  const id = parseId((await params).id);
  const detail = await getRequestDetail(user, id);
  if (!detail) throw new ApiError(404, "Request not found");
  return detail;
});

export const PATCH = handle(async (req, { params }) => {
  const user = await requireUser("student", "staff", "admin");
  const id = parseId((await params).id);
  const row = await getScopedRequest(user, id);
  if (!row) throw new ApiError(404, "Request not found");
  if (user.role !== "admin" && row.status !== "pending") {
    throw new ApiError(409, "You can only edit a request while it is still pending");
  }

  const input = await parseBody(req, updateRequestSchema);
  const [updated] = await db
    .update(schema.serviceRequests)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.serviceRequests.id, id))
    .returning();
  await audit(user.id, "request.update", "request", id, input);
  return updated;
});

export const DELETE = handle(async (_req, { params }) => {
  const user = await requireUser("admin");
  const id = parseId((await params).id);
  const row = await getScopedRequest(user, id);
  if (!row) throw new ApiError(404, "Request not found");
  await db.delete(schema.serviceRequests).where(eq(schema.serviceRequests.id, id));
  await audit(user.id, "request.delete", "request", id, { title: row.title });
  return { ok: true };
});
