import { describe, expect, it } from "vitest";

import { createCreatureId, normalizeCreatureInput } from "@/lib/creatures/validation";

const baseCreatureInput = {
  name: "Cave Brute",
  size: "medium",
  type: "humanoid",
  alignment: "unaligned",
  cr: "1/2",
  ac: { value: 12 },
  hp: { average: 13, formula: "3d8" },
  speed: { walk: 30 },
  stats: { str: 14, dex: 10, con: 12, int: 8, wis: 10, cha: 8 },
  senses: ["passive Perception 10"],
  languages: [],
  traits: [],
  actions: [{ name: "Club", description: "Melee weapon attack." }],
};

describe("creature input normalization", () => {
  it("creates UUID ids", () => {
    expect(createCreatureId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("normalizes imported JSON into a valid creature with a generated id", () => {
    const creature = normalizeCreatureInput(baseCreatureInput);

    expect(creature.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(creature.source).toBe("manual");
    expect(creature.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(creature.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("ignores caller-provided ids for new creatures", () => {
    const creature = normalizeCreatureInput({
      ...baseCreatureInput,
      id: "caller-selected-id",
    });

    expect(creature.id).not.toBe("caller-selected-id");
  });

  it("rejects invalid dice expressions with field-level paths", () => {
    expect(() =>
      normalizeCreatureInput({
        ...baseCreatureInput,
        hp: { average: 13, formula: "bad dice" },
      }),
    ).toThrow();
  });
});
