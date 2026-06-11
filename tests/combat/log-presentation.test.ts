import { describe, expect, it } from "vitest";

import { getLatestCombatLogBatch } from "@/lib/combat/log-presentation";
import type { CombatLogEntry } from "@/lib/schemas/encounter";

function logEntry(
  id: string,
  overrides: Partial<CombatLogEntry> = {},
): CombatLogEntry {
  return {
    id,
    createdAt: "2026-06-11T00:00:00.000Z",
    attackerName: "Goblin #1",
    targetName: "Target",
    targetAc: 15,
    actionName: "Scimitar",
    outcome: "hit",
    toHit: {
      expression: "1d20",
      rolls: [12],
      modifier: 4,
      total: 16,
    },
    damage: {
      expression: "1d6+2",
      rolls: [3],
      modifier: 2,
      rawTotal: 5,
      total: 5,
      mode: "normal",
      type: "slashing",
    },
    ...overrides,
  };
}

describe("combat log presentation", () => {
  it("highlights only entries from the latest rolled batch", () => {
    const latest = getLatestCombatLogBatch([
      logEntry("new-hit", { batchId: "new", damage: { ...logEntry("x").damage!, total: 7 } }),
      logEntry("new-miss", { batchId: "new", damage: undefined, outcome: "miss" }),
      logEntry("old-hit", { batchId: "old" }),
      logEntry("legacy-entry", { batchId: undefined }),
    ]);

    expect([...latest.highlightedEntryIds]).toEqual(["new-hit", "new-miss"]);
    expect(latest.damageTotal).toBe(7);
    expect(latest.hasTargetAc).toBe(true);
  });

  it("falls back to highlighting only the first entry for legacy logs without batch ids", () => {
    const latest = getLatestCombatLogBatch([
      logEntry("legacy-first", { batchId: undefined }),
      logEntry("legacy-second", { batchId: undefined }),
    ]);

    expect([...latest.highlightedEntryIds]).toEqual(["legacy-first"]);
  });
});
