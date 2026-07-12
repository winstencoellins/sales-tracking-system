import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isApi =
    pathname.startsWith("/api/varieties") ||
    pathname.startsWith("/api/customers") ||
    pathname.startsWith("/api/transactions") ||
    pathname.startsWith("/api/reports") ||
    pathname.startsWith("/api/backup") ||
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/profile") ||
    pathname.startsWith("/api/users");

  if (!sessionCookie) {
    if (isApi) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 },
      );
    }
    if (!isPublic) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
