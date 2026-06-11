import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/auth/redirect";

describe("auth redirects", () => {
  it("keeps internal next paths and rejects external URLs", () => {
    expect(safeRedirectPath("/library?search=goblin")).toBe("/library?search=goblin");
    expect(safeRedirectPath("https://evil.test/library")).toBe("/");
    expect(safeRedirectPath("//evil.test/library")).toBe("/");
  });
});
