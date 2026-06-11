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

const owlbear: Creature = {
  id: "owlbear",
  name: "Owlbear",
  size: "large",
  type: "monstrosity",
  alignment: "unaligned",
  cr: "3",
  ac: { value: 13 },
  hp: { average: 59, formula: "7d10+21" },
  speed: { walk: 40 },
  stats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
  senses: ["darkvision 60 ft.", "passive Perception 13"],
  languages: [],
  traits: [],
  actions: [
    {
      name: "Multiattack",
      attacks: [
        { actionName: "Beak", count: 1 },
        { actionName: "Claws", count: 1 },
      ],
    },
    {
      name: "Beak",
      attackBonus: 7,
      damage: [{ dice: "1d10+5", type: "piercing" }],
    },
    {
      name: "Claws",
      attackBonus: 7,
      damage: [{ dice: "2d8+5", type: "slashing" }],
    },
  ],
  createdAt: "2026-06-09T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

const encounter: Encounter = {
  id: "round-test",
  name: "Round Test",
  combatants: [
    {
      id: "goblin-1",
      creatureId: "goblin",
      instanceName: "Goblin #1",
      currentHp: 7,
      maxHp: 7,
      tempHp: 0,
      conditions: [],
      isActive: true,
    },
    {
      id: "goblin-2",
      creatureId: "goblin",
      instanceName: "Goblin #2",
      currentHp: 7,
      maxHp: 7,
      tempHp: 3,
      conditions: [],
      isActive: true,
    },
    {
      id: "goblin-3",
      creatureId: "goblin",
      instanceName: "Goblin #3",
      currentHp: 0,
      maxHp: 7,
      tempHp: 0,
      conditions: [],
      isActive: true,
    },
  ],
  log: [],
  createdAt: "2026-06-09T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

describe("encounter round engine", () => {
  it("runs selected active combatants against a manual target AC without changing combatant HP", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1", "goblin-2", "goblin-3"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
        "goblin-2": "Shortbow",
        "goblin-3": "Shortbow",
      },
      targetAcEnabled: true,
      targetAc: 15,
      damageMode: "normal",
      random: fixedRolls([0.6, 0.5, 0.1]),
    });

    expect(result.combatants.find((combatant) => combatant.id === "goblin-2")).toMatchObject({
      currentHp: 7,
      tempHp: 3,
    });
    expect(result.log).toHaveLength(2);
    expect(result.log[0]).toMatchObject({
      batchId: result.log[0]?.batchId,
      attackerName: "Goblin #1",
      targetName: "Target",
      targetAc: 15,
      actionName: "Shortbow",
      outcome: "hit",
      toHit: {
        expression: "1d20",
        rolls: [13],
        modifier: 4,
        total: 17,
      },
      damage: {
        expression: "1d6+2",
        rolls: [4],
        modifier: 2,
        total: 6,
        type: "piercing",
      },
    });
    expect(result.log[1]).toMatchObject({
      batchId: result.log[0]?.batchId,
      attackerName: "Goblin #2",
      targetName: "Target",
      outcome: "miss",
      damage: undefined,
    });
  });

  it("marks natural 1 as a fumble even when target AC is enabled", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
      },
      targetAcEnabled: true,
      targetAc: 15,
      damageMode: "normal",
      random: fixedRolls([0]),
    });

    expect(result.log[0]).toMatchObject({
      outcome: "fumble",
      damage: undefined,
    });
  });

  it("logs neutral attack and damage rolls when target AC is disabled", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
      },
      targetAcEnabled: false,
      targetAc: 10,
      damageMode: "normal",
      random: fixedRolls([0.5, 0.5]),
    });

    expect(result.combatants).toEqual(encounter.combatants);
    expect(result.log[0]).toMatchObject({
      outcome: "roll",
      targetAc: undefined,
      toHit: {
        rolls: [11],
        modifier: 4,
        total: 15,
      },
      damage: {
        rolls: [4],
        modifier: 2,
        total: 6,
      },
    });
  });

  it("does not roll damage on a fumble when target AC is disabled", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
      },
      targetAcEnabled: false,
      targetAc: 10,
      damageMode: "normal",
      random: fixedRolls([0]),
    });

    expect(result.log[0]).toMatchObject({
      outcome: "fumble",
      damage: undefined,
    });
  });

  it("doubles damage dice on a critical when target AC is disabled", () => {
    const result = runEncounterRound({
      encounter,
      creatures: [goblin],
      selectedCombatantIds: ["goblin-1"],
      actionByCombatantId: {
        "goblin-1": "Shortbow",
      },
      targetAcEnabled: false,
      targetAc: 10,
      damageMode: "normal",
      random: fixedRolls([0.999, 0.5, 0.5]),
    });

    expect(result.log[0]).toMatchObject({
      outcome: "critical",
      damage: {
        rolls: [4, 4],
        modifier: 2,
        total: 10,
      },
    });
  });

  it("runs configured multiattack actions as separate rolls in one batch", () => {
    const owlbearEncounter: Encounter = {
      ...encounter,
      combatants: [
        {
          id: "owlbear-1",
          creatureId: "owlbear",
          instanceName: "Owlbear #1",
          currentHp: 59,
          maxHp: 59,
          tempHp: 0,
          conditions: [],
          isActive: true,
        },
      ],
    };
    const result = runEncounterRound({
      encounter: owlbearEncounter,
      creatures: [owlbear],
      selectedCombatantIds: ["owlbear-1"],
      actionByCombatantId: {
        "owlbear-1": "Multiattack",
      },
      targetAcEnabled: true,
      targetAc: 13,
      damageMode: "normal",
      random: fixedRolls([0.5, 0.5, 0.5, 0.5, 0.5]),
    });

    expect(result.log).toHaveLength(2);
    expect(result.log.map((entry) => entry.actionName)).toEqual(["Beak", "Claws"]);
    expect(new Set(result.log.map((entry) => entry.batchId)).size).toBe(1);
    expect(result.log.map((entry) => entry.damage?.total)).toEqual([11, 15]);
  });
});
