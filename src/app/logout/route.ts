import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName } from "@/lib/auth/session";

export function GET(request: NextRequest) {
  return endSession(request);
}

export function POST(request: NextRequest) {
  return endSession(request);
}

function endSession(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
