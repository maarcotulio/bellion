import { describe, expect, it } from "vitest";

import {
  parseDice,
  resolveAttack,
  resolveDamage,
  roll,
  rollD20,
  type RandomSource,
} from "@/lib/dice";

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

describe("dice engine", () => {
  it("parses a dice expression with positive modifier", () => {
    expect(parseDice("2d6+3")).toEqual({
      count: 2,
      sides: 6,
      modifier: 3,
    });
  });

  it("parses a dice expression with negative modifier", () => {
    expect(parseDice("1d20-1")).toEqual({
      count: 1,
      sides: 20,
      modifier: -1,
    });
  });

  it("rejects malformed dice expressions", () => {
    expect(() => parseDice("d20+2")).toThrow("Invalid dice expression");
  });

  it("rolls dice with deterministic breakdown and modifier", () => {
    expect(roll("2d6+3", fixedRolls([0, 0.999]))).toEqual({
      expression: "2d6+3",
      rolls: [1, 6],
      modifier: 3,
      total: 10,
    });
  });

  it("rolls a plain d20 with modifier", () => {
    expect(rollD20({ modifier: 4, random: fixedRolls([0.45]) })).toMatchObject({
      mode: "normal",
      rolls: [10],
      selected: 10,
      total: 14,
      isCritical: false,
      isFumble: false,
    });
  });

  it("keeps the higher d20 with advantage", () => {
    expect(rollD20({ advantage: true, random: fixedRolls([0.1, 0.9]) })).toMatchObject({
      mode: "advantage",
      rolls: [3, 19],
      selected: 19,
      total: 19,
    });
  });

  it("keeps the lower d20 with disadvantage", () => {
    expect(rollD20({ disadvantage: true, random: fixedRolls([0.1, 0.9]) })).toMatchObject({
      mode: "disadvantage",
      rolls: [3, 19],
      selected: 3,
      total: 3,
    });
  });

  it("cancels advantage and disadvantage", () => {
    expect(
      rollD20({
        advantage: true,
        disadvantage: true,
        random: fixedRolls([0.9]),
      }),
    ).toMatchObject({
      mode: "normal",
      rolls: [19],
      selected: 19,
    });
  });

  it("marks natural 20 as critical", () => {
    expect(rollD20({ random: fixedRolls([0.999]) })).toMatchObject({
      selected: 20,
      isCritical: true,
    });
  });

  it("marks natural 1 as fumble", () => {
    expect(rollD20({ random: fixedRolls([0]) })).toMatchObject({
      selected: 1,
      isFumble: true,
    });
  });

  it("resolves normal attack hits by total against AC", () => {
    expect(
      resolveAttack({
        attackBonus: 5,
        targetAc: 15,
        random: fixedRolls([0.45]),
      }),
    ).toMatchObject({
      hit: true,
      critical: false,
    });
  });

  it("resolves misses below AC", () => {
    expect(
      resolveAttack({
        attackBonus: 2,
        targetAc: 18,
        random: fixedRolls([0.25]),
      }),
    ).toMatchObject({
      hit: false,
      critical: false,
    });
  });

  it("natural 20 hits and crits even below AC", () => {
    expect(
      resolveAttack({
        attackBonus: 0,
        targetAc: 40,
        random: fixedRolls([0.999]),
      }),
    ).toMatchObject({
      hit: true,
      critical: true,
    });
  });

  it("natural 1 misses even with high bonus", () => {
    expect(
      resolveAttack({
        attackBonus: 20,
        targetAc: 5,
        random: fixedRolls([0]),
      }),
    ).toMatchObject({
      hit: false,
      critical: false,
    });
  });

  it("resolves normal damage", () => {
    expect(resolveDamage({ dice: "2d6+3", random: fixedRolls([0, 0.5]) })).toMatchObject({
      total: 8,
      rawTotal: 8,
      mode: "normal",
    });
  });

  it("halves damage for resistance", () => {
    expect(
      resolveDamage({
        dice: "2d6+3",
        mode: "half",
        random: fixedRolls([0.999, 0.999]),
      }),
    ).toMatchObject({
      rawTotal: 15,
      total: 7,
    });
  });

  it("doubles damage for vulnerability", () => {
    expect(
      resolveDamage({
        dice: "1d8+2",
        mode: "double",
        random: fixedRolls([0.5]),
      }),
    ).toMatchObject({
      rawTotal: 7,
      total: 14,
    });
  });

  it("zeros damage for immunity", () => {
    expect(
      resolveDamage({
        dice: "1d8+2",
        mode: "immune",
        random: fixedRolls([0.5]),
      }),
    ).toMatchObject({
      total: 0,
    });
  });

  it("doubles only dice on critical damage, not modifier", () => {
    expect(
      resolveDamage({
        dice: "1d8+2",
        critical: true,
        random: fixedRolls([0.5, 0.5]),
      }),
    ).toMatchObject({
      rolls: [5, 5],
      rawTotal: 12,
      total: 12,
    });
  });
});
