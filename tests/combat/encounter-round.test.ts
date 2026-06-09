import { describe, expect, it } from "vitest";

import { runEncounterRound } from "@/lib/combat/encounter-round";
import type { Encounter } from "@/lib/schemas/encounter";
import type { Creature } from "@/lib/schemas/creature";
import type { RandomSource } from "@/lib/dice";

function fixedRolls(values: readonly number[]): RandomSource {
  let index = 0;

  return () => {
    const value = values[index];
    index += 1;

    if (value === undefined) {
      throw new Error("No fixed roll left.");
    }

    return value;
  };
}

const goblin: Creature = {
  id: "goblin",
  name: "Goblin",
  size: "small",
  type: "humanoid",
  alignment: "neutral evil",
  cr: "1/4",
  ac: { value: 15 },
  hp: { average: 7, formula: "2d6" },
  speed: { walk: 30 },
  stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  senses: ["darkvision 60 ft.", "passive Perception 9"],
  languages: ["Common", "Goblin"],
  traits: [],
  actions: [
    {
      name: "Shortbow",
      attackBonus: 4,
      damage: [{ dice: "1d6+2", type: "piercing" }],
    },
  ],
  createdAt: "2026-06-09T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

const encounter: Encounter = {
  id: "round-test",
  name: "Round Test",
  target: {
    name: "Knight",
    ac: 12,
    currentHp: 30,
    maxHp: 30,
  },
  combatants: [
    {
      id: "goblin-1",
      creatureId: "goblin",
      instanceName: "Goblin #1",
      currentHp: 7,
      maxHp: 7,
      conditions: [],
      isActive: true,
    },
    {
      id: "goblin-2",
      creatureId: "goblin",
      instanceName: "Goblin #2",
      currentHp: 7,
      maxHp: 7,
      conditions: [],
      isActive: true,
    },
    {
      id: "goblin-3",
      creatureId: "goblin",
      instanceName: "Goblin #3",
      currentHp: 0,
      maxHp: 7,
      conditions: [],
      isActive: true,
    },
  ],
  log: [],
  createdAt: "2026-06-09T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

describe("encounter round engine", () => {
  it("runs selected active combatants in sequence, updates target HP, and logs each roll", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1", "goblin-2", "goblin-3"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
        "goblin-2": "Shortbow",
        "goblin-3": "Shortbow",
      },
      damageMode: "normal",
      random: fixedRolls([0.6, 0.5, 0.1]),
    });

    expect(result.target.currentHp).toBe(24);
    expect(result.log).toHaveLength(2);
    expect(result.log[0]?.text).toContain("Goblin #1");
    expect(result.log[0]?.text).toContain("6 damage");
    expect(result.log[1]?.text).toContain("Goblin #2");
    expect(result.log[1]?.text).toContain("miss");
  });
});
