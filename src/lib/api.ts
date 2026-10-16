import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getSession, type SessionUser } from "@/lib/auth";
import type { RoleName } from "@/db/schema";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: Ctx) => Promise<unknown>;

/** Wraps a route handler: JSON-serialises results and maps errors to HTTP responses. */
export function handle(fn: Handler) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const result = await fn(req, ctx);
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".") || "_";
          fields[key] ??= issue.message;
        }
        return NextResponse.json(
          { error: "Please check the highlighted fields", fields },
          { status: 400 }
        );
      }
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, fields: err.fields }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong on our side" }, { status: 500 });
    }
  };
}

export async function requireUser(...roles: RoleName[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new ApiError(401, "Sign in to continue");
  if (roles.length && !roles.includes(user.role)) {
    throw new ApiError(403, "You do not have permission to do that");
  }
  return user;
}

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  return schema.parse(json);
}

export function parseId(raw: string, label = "id") {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `Invalid ${label}`);
  return n;
}
