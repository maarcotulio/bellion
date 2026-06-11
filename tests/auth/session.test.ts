import { describe, expect, it } from "vitest";

import { authenticateAppPassword, verifySessionToken } from "@/lib/auth/session";

const authEnv = {
  APP_PASSWORD: "open-the-gate",
  SESSION_SECRET: "test-session-secret-with-enough-length",
};

describe("shared password session auth", () => {
  it("accepts a session created from the shared app password", async () => {
    const issuedAt = new Date("2026-06-11T10:00:00.000Z");
    const token = await authenticateAppPassword("open-the-gate", {
      env: authEnv,
      now: issuedAt,
    });

    await expect(
      verifySessionToken(token, {
        env: authEnv,
        now: new Date("2026-06-12T10:00:00.000Z"),
      }),
    ).resolves.toBe(true);
  });

  it("rejects an invalid shared app password", async () => {
    await expect(
      authenticateAppPassword("wrong-password", {
        env: authEnv,
        now: new Date("2026-06-11T10:00:00.000Z"),
      }),
    ).resolves.toBeNull();
  });

  it("rejects a session token after tampering", async () => {
    const token = await authenticateAppPassword("open-the-gate", {
      env: authEnv,
      now: new Date("2026-06-11T10:00:00.000Z"),
    });
    const tamperedToken = `${token}x`;

    await expect(
      verifySessionToken(tamperedToken, {
        env: authEnv,
        now: new Date("2026-06-12T10:00:00.000Z"),
      }),
    ).resolves.toBe(false);
  });

  it("rejects an expired session token", async () => {
    const token = await authenticateAppPassword("open-the-gate", {
      env: authEnv,
      now: new Date("2026-06-11T10:00:00.000Z"),
    });

    await expect(
      verifySessionToken(token, {
        env: authEnv,
        now: new Date("2026-07-12T10:00:00.000Z"),
      }),
    ).resolves.toBe(false);
  });

  it("fails clearly when auth env is missing", async () => {
    await expect(
      authenticateAppPassword("open-the-gate", {
        env: {},
        now: new Date("2026-06-11T10:00:00.000Z"),
      }),
    ).rejects.toThrow("APP_PASSWORD must be configured");
  });
});
