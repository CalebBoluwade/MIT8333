import { db, schema } from "@/db";
import { handle, parseBody, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { listRequests } from "@/lib/requests";
import { createRequestApiSchema, listQuerySchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export const GET = handle(async (req) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  // Empty strings from filter forms should behave like "not provided".
  for (const k of Object.keys(params)) if (params[k] === "") delete params[k];
  return listRequests(user, listQuerySchema.parse(params));
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, createRequestApiSchema);

  const request = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.serviceRequests)
      .values({ ...input, requesterId: user.id })
      .returning();
    await tx.insert(schema.statusLogs).values({
      requestId: created.id,
      fromStatus: null,
      toStatus: "pending",
      note: "Request submitted",
      changedById: user.id,
    });
    return created;
  });

  const admins = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(eq(schema.roles.name, "admin"));
  await Promise.all(
    admins.map((a) => notify(a.id, `New request #${request.id}: ${request.title}`, request.id))
  );
  await audit(user.id, "request.create", "request", request.id);

  return Response.json(request, { status: 201 });
});
