import { NextResponse, type NextRequest } from "next/server";

import { readAuthConfig, sessionCookieName, verifySessionToken } from "@/lib/auth/session";

const publicFilePattern = /\.[^/]+$/u;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  readAuthConfig();

  const token = request.cookies.get(sessionCookieName)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/logout" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    publicFilePattern.test(pathname)
  );
}
