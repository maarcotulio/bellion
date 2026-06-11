import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createEncounter,
  deleteEncounter,
  getEncounter,
  listEncounters,
  updateEncounter,
} from "@/lib/encounters/repository";
import { disconnectFromMongo } from "@/lib/db/mongoose";
import type { Encounter } from "@/lib/schemas/encounter";

const encounterId = "vitest-m3-encounter";

function makeLogEntries(count: number): Encounter["log"] {
  const now = new Date().toISOString();

  return Array.from({ length: count }, (_, index) => ({
    id: `log-${index}`,
    batchId: `batch-${Math.floor(index / 2)}`,
    createdAt: now,
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
  }));
}

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  const now = new Date().toISOString();

  return {
    id: encounterId,
    name: "Vitest M3 Encounter",
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
    ],
    log: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("encounter repository", () => {
  beforeEach(async () => {
    await deleteEncounter(encounterId);
  });

  afterAll(async () => {
    await deleteEncounter(encounterId);
    await disconnectFromMongo();
  });

  it("creates, reads, lists, updates, and deletes encounters", async () => {
    await createEncounter(makeEncounter());

    await expect(getEncounter(encounterId)).resolves.toMatchObject({
      id: encounterId,
      name: "Vitest M3 Encounter",
    });

    const encounters = await listEncounters();
    expect(encounters.map((encounter) => encounter.id)).toContain(encounterId);

    const updated = await updateEncounter(
      encounterId,
      makeEncounter({
        name: "Vitest M3 Encounter Updated",
        combatants: [
          {
            id: "goblin-1",
            creatureId: "goblin",
            instanceName: "Goblin #1",
            currentHp: 5,
            maxHp: 7,
            tempHp: 3,
            conditions: [],
            isActive: true,
          },
        ],
      }),
    );
    expect(updated?.name).toBe("Vitest M3 Encounter Updated");
    expect(updated?.combatants[0]?.currentHp).toBe(5);
    expect(updated?.combatants[0]?.tempHp).toBe(3);

    await expect(deleteEncounter(encounterId)).resolves.toBe(true);
    await expect(getEncounter(encounterId)).resolves.toBeNull();
  });

  it("updates and reads encounters with many combat log entries", async () => {
    await createEncounter(makeEncounter());

    const updated = await updateEncounter(
      encounterId,
      makeEncounter({
        log: makeLogEntries(250),
      }),
    );

    expect(updated?.log).toHaveLength(250);
    await expect(getEncounter(encounterId)).resolves.toMatchObject({
      id: encounterId,
      log: expect.arrayContaining([
        expect.objectContaining({
          id: "log-249",
          batchId: "batch-124",
        }),
      ]),
    });
  });
});
