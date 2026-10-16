import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody } from "@/lib/api";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { registerSchema } from "@/lib/validators";

export const POST = handle(async (req) => {
  const input = await parseBody(req, registerSchema);

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, input.email));
  if (existing) {
    throw new ApiError(409, "An account with this email already exists", { email: "This email is already registered" });
  }

  const [role] = await db.select().from(schema.roles).where(eq(schema.roles.name, input.role));
  if (!role) throw new ApiError(500, "Role not found");
  const id = randomUUID();
  await db.insert(schema.users).values({
    id,
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    roleId: role.id,
  });

  const user = { id, name: input.name, email: input.email, role: input.role };
  await setSessionCookie(user);
  await audit(id, "user.register", "user", id);
  return Response.json({ user }, { status: 201 });
});
