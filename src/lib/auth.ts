import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionUser,
} from "@/lib/jwt";

import { redirect } from "next/navigation";
import { RoleName } from "@/db/schema";

export {
  SESSION_COOKIE,
  homePathFor,
  signSession,
  verifySession,
  type SessionUser,
} from "@/lib/jwt";

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: RoleName[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
