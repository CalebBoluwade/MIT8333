import type { RoleName } from "@/db/schema";

export const SESSION_COOKIE = "session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
};

export const homePathFor = (role: RoleName) =>
  role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/dashboard";
