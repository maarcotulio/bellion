import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("library page", () => {
  it("keeps the creature CR badge at a fixed width", () => {
    const source = readFileSync("src/app/library/page.tsx", "utf8");

    expect(source).toContain("w-16 shrink-0");
  });
});
