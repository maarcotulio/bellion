import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { authenticateAppPassword, sessionCookieName } from "@/lib/auth/session";

import { middleware } from "@/middleware";

const originalEnv = process.env;

describe("app auth middleware", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("redirects unauthenticated page requests to login", async () => {
    process.env = {
      ...originalEnv,
      APP_PASSWORD: "open-the-gate",
      SESSION_SECRET: "test-session-secret-with-enough-length",
    };

    const response = await middleware(new NextRequest("https://royal.test/library"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://royal.test/login?next=%2Flibrary");
  });

  it("fails clearly when private routes run without auth env", async () => {
    process.env = {
      ...originalEnv,
      APP_PASSWORD: undefined,
      SESSION_SECRET: undefined,
    };

    await expect(middleware(new NextRequest("https://royal.test/library"))).rejects.toThrow(
      "APP_PASSWORD must be configured",
    );
  });

  it("returns JSON 401 for unauthenticated API requests", async () => {
    process.env = {
      ...originalEnv,
      APP_PASSWORD: "open-the-gate",
      SESSION_SECRET: "test-session-secret-with-enough-length",
    };

    const response = await middleware(new NextRequest("https://royal.test/api/creatures"));

    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
    expect(response.status).toBe(401);
  });

  it("allows unauthenticated login page requests", async () => {
    const response = await middleware(new NextRequest("https://royal.test/login"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows logout requests without a valid session", async () => {
    const response = await middleware(new NextRequest("https://royal.test/logout"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows authenticated app requests", async () => {
    const authEnv = {
      APP_PASSWORD: "open-the-gate",
      SESSION_SECRET: "test-session-secret-with-enough-length",
    };
    process.env = {
      ...originalEnv,
      ...authEnv,
    };
    const token = await authenticateAppPassword("open-the-gate", {
      env: authEnv,
      now: new Date(),
    });

    const response = await middleware(
      new NextRequest("https://royal.test/library", {
        headers: {
          cookie: `${sessionCookieName}=${token}`,
        },
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
