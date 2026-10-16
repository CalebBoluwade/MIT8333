import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseBody } from "@/lib/api";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { loginSchema } from "@/lib/validators";

export const POST = handle(async (req) => {
  const { email, password } = await parseBody(req, loginSchema);

  const [row] = await db
    .select({ u: schema.users, role: schema.roles.name })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(eq(schema.users.email, email));

  // Same message for unknown email and wrong password, so accounts can't be probed.
  const ok = row && (await verifyPassword(password, row.u.passwordHash));
  if (!ok) throw new ApiError(401, "Incorrect email or password");
  if (!row.u.isActive) throw new ApiError(403, "This account has been deactivated. Contact an administrator.");

  const user = { id: row.u.id, name: row.u.name, email: row.u.email, role: row.role };
  await setSessionCookie(user);
  await audit(user.id, "user.login", "user", user.id);
  return { user };
});
