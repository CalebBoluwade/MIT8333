import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, homePathFor, verifySession } from "@/lib/jwt";

const PUBLIC = ["/login", "/register", "/api-docs"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(homePathFor(user.role), req.url));
  }
  if (user) {
    if (pathname.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(new URL(homePathFor(user.role), req.url));
    }
    if (pathname.startsWith("/officer") && user.role !== "officer") {
      return NextResponse.redirect(new URL(homePathFor(user.role), req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
