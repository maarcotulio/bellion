import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  exportRoyalBellionBackup,
  importRoyalBellionBackup,
} from "@/lib/backups/repository";
import { RoyalBellionBackupSchema } from "@/lib/backups/schema";
import { deleteCreature, getCreature } from "@/lib/creatures/repository";
import { disconnectFromMongo } from "@/lib/db/mongoose";
import { deleteEncounter, getEncounter } from "@/lib/encounters/repository";
import type { Creature } from "@/lib/schemas/creature";
import type { Encounter } from "@/lib/schemas/encounter";

const creatureId = "backup-test-creature";
const encounterId = "backup-test-encounter";

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  const now = new Date().toISOString();

  return {
    id: creatureId,
    name: "Backup Test Creature",
    size: "medium",
    type: "humanoid",
    alignment: "unaligned",
    cr: "1/4",
    ac: { value: 12 },
    hp: { average: 9, formula: "2d8" },
    speed: { walk: 30 },
    stats: { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 },
    senses: ["passive Perception 10"],
    languages: [],
    traits: [],
    actions: [{ name: "Strike", description: "Basic attack." }],
    source: "manual",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  const now = new Date().toISOString();

  return {
    id: encounterId,
    name: "Backup Test Encounter",
    combatants: [
      {
        id: "backup-test-combatant",
        creatureId,
        instanceName: "Backup Test Creature 1",
        currentHp: 9,
        maxHp: 9,
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

describe("Royal Bellion backups", () => {
  beforeEach(async () => {
    await deleteEncounter(encounterId);
    await deleteCreature(creatureId);
  });

  afterAll(async () => {
    await deleteEncounter(encounterId);
    await deleteCreature(creatureId);
    await disconnectFromMongo();
  });

  it("validates the backup file shape", () => {
    const parsed = RoyalBellionBackupSchema.parse({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        creatures: [makeCreature()],
        encounters: [makeEncounter()],
      },
    });

    expect(parsed.data.creatures[0]?.id).toBe(creatureId);
    expect(() =>
      RoyalBellionBackupSchema.parse({
        version: 2,
        exportedAt: new Date().toISOString(),
        data: { creatures: [], encounters: [] },
      }),
    ).toThrow();
  });

  it("imports backups with upsert semantics and preserves ids", async () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        creatures: [makeCreature()],
        encounters: [makeEncounter()],
      },
    };

    const firstImport = await importRoyalBellionBackup(backup);

    expect(firstImport.creatures.upserted).toBe(1);
    expect(firstImport.encounters.upserted).toBe(1);
    await expect(getCreature(creatureId)).resolves.toMatchObject({
      id: creatureId,
      name: "Backup Test Creature",
    });
    await expect(getEncounter(encounterId)).resolves.toMatchObject({
      id: encounterId,
      name: "Backup Test Encounter",
    });

    const secondImport = await importRoyalBellionBackup({
      ...backup,
      data: {
        creatures: [makeCreature({ name: "Backup Test Creature Updated" })],
        encounters: [makeEncounter({ name: "Backup Test Encounter Updated" })],
      },
    });

    expect(secondImport.creatures.matched).toBe(1);
    expect(secondImport.encounters.matched).toBe(1);
    await expect(getCreature(creatureId)).resolves.toMatchObject({
      id: creatureId,
      name: "Backup Test Creature Updated",
    });
    await expect(getEncounter(encounterId)).resolves.toMatchObject({
      id: encounterId,
      name: "Backup Test Encounter Updated",
    });
  });

  it("exports supported collections in backup format", async () => {
    await importRoyalBellionBackup({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        creatures: [makeCreature()],
        encounters: [makeEncounter()],
      },
    });

    const backup = await exportRoyalBellionBackup();

    expect(backup.version).toBe(1);
    expect(backup.data.creatures.some((creature) => creature.id === creatureId)).toBe(true);
    expect(backup.data.encounters.some((encounter) => encounter.id === encounterId)).toBe(true);
  });
});
