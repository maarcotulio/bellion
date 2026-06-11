import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("combat log source", () => {
  it("shows the outcome beside To Hit in the primary blue accent", () => {
    const source = readFileSync("src/components/ui/combat-log.tsx", "utf8");

    expect(source).toContain("outcomeLabel");
    expect(source).toContain("text-primary");
    expect(source).toContain("To Hit");
    expect(source).toContain("critical miss");
  });

  it("shows damage totals only for target AC rolls", () => {
    const source = readFileSync("src/components/ui/combat-log.tsx", "utf8");

    expect(source).toContain("showDamageTotal");
    expect(source).toContain("entry.targetAc !== undefined");
  });

  it("highlights every entry from the latest batch and renders total damage", () => {
    const source = readFileSync("src/components/ui/combat-log.tsx", "utf8");

    expect(source).toContain("getLatestCombatLogBatch");
    expect(source).toContain("Total Damage");
    expect(source).toContain("latestBatch.damageTotal");
  });

  it("uses a blue border without a blue glow for the latest batch", () => {
    const source = readFileSync("src/components/ui/combat-log.tsx", "utf8");

    expect(source).toContain("border-2 border-transparent");
    expect(source).toContain("border-[#3ed0ff]");
    expect(source).toContain("bg-primary/10");
    expect(source).not.toContain("border-border/60");
    expect(source).not.toContain("border-primary/70");
    expect(source).not.toContain("rgba(62,208,255");
  });
});
