"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  authenticateAppPassword,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/auth/session";

export async function loginWithSharedPassword(formData: FormData) {
  const password = formData.get("password");
  const next = safeRedirectPath(formData.get("next"));

  if (typeof password !== "string") {
    redirect(loginErrorPath(next));
  }

  const token = await authenticateAppPassword(password);

  if (!token) {
    redirect(loginErrorPath(next));
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, getSessionCookieOptions());
  redirect(next);
}

function loginErrorPath(next: string) {
  const params = new URLSearchParams({ error: "invalid" });

  if (next !== "/") {
    params.set("next", next);
  }

  return `/login?${params.toString()}`;
}
