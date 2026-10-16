import { handle } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export const POST = handle(async () => {
  await clearSessionCookie();
  return { ok: true };
});
