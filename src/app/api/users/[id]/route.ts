import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validators";

export const PATCH = handle(async (req, { params }) => {
  const admin = await requireUser("admin");
  const { id } = await params;
  const input = await parseBody(req, updateUserSchema);

  if (id === admin.id && (input.role && input.role !== "admin" || input.isActive === false)) {
    throw new ApiError(409, "You can't remove your own admin access or deactivate yourself");
  }
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (!target) throw new ApiError(404, "User not found");

  const patch: Partial<typeof schema.users.$inferInsert> = {};
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.role) {
    const [role] = await db.select().from(schema.roles).where(eq(schema.roles.name, input.role));
    patch.roleId = role.id;
  }
  if (Object.keys(patch).length) {
    await db.update(schema.users).set(patch).where(eq(schema.users.id, id));
  }
  await audit(admin.id, "user.update", "user", id, input);
  return { ok: true };
});
