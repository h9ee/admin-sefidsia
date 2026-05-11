import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/assets", "/api"];

/**
 * Optimistic redirect — keeps unauthenticated visitors out of admin routes.
 * Real session validation still happens client-side via /auth/me + axios refresh.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // We rely on a non-httpOnly cookie mirror "ss-auth-presence" set client-side
  // when a session exists. Tokens themselves stay in localStorage.
  const presence = req.cookies.get("ss-auth-presence")?.value;
  if (!presence && pathname !== "/login") {
    const next = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
