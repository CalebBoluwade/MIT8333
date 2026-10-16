import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/lib/auth-utils";
import type { RoleName } from "@/db/schema";
export { SESSION_COOKIE, homePathFor } from "@/lib/auth-utils";
export type { SessionUser } from "@/lib/auth-utils";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

async function secret() {
  const s = process.env.JWT_SECRET;
  const raw = new TextEncoder().encode(
    s && s.length >= 16 ? s : "dev-only-secret-change-me-please"
  );
  if (process.env.NODE_ENV === "production" && (!s || s.length < 16)) {
    throw new Error("JWT_SECRET must be set (16+ characters) in production");
  }
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(await secret());
}

export async function verifySession(
  token?: string | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await secret());

    return {
      id: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as RoleName,
    };
  } catch {
    return null;
  }
}


