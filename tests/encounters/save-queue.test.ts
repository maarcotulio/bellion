import { describe, expect, it } from "vitest";

import { createEncounterSaveQueue } from "@/lib/encounters/save-queue";
import type { Encounter } from "@/lib/schemas/encounter";

function makeEncounter(id: string, logCount: number): Encounter {
  const now = new Date().toISOString();

  return {
    id,
    name: "Queued Encounter",
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
    log: Array.from({ length: logCount }, (_, index) => ({
      id: `log-${index}`,
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
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("encounter save queue", () => {
  it("serializes overlapping saves and only accepts the newest server response", async () => {
    const firstSave = deferred<Encounter>();
    const secondSave = deferred<Encounter>();
    const saveCalls: Encounter[] = [];
    const saved: Encounter[] = [];
    const savingStates: boolean[] = [];
    const queue = createEncounterSaveQueue({
      save: (encounter) => {
        saveCalls.push(encounter);

        return saveCalls.length === 1 ? firstSave.promise : secondSave.promise;
      },
      onSaved: (encounter) => saved.push(encounter),
      onError: () => undefined,
      onSavingChange: (isSaving) => savingStates.push(isSaving),
    });

    const first = makeEncounter("queued-encounter", 1);
    const newest = makeEncounter("queued-encounter", 3);
    const firstDrain = queue.enqueue(first);
    const newestDrain = queue.enqueue(newest);

    expect(saveCalls.map((encounter) => encounter.log.length)).toEqual([1]);

    firstSave.resolve(first);
    await flushMicrotasks();

    expect(saveCalls.map((encounter) => encounter.log.length)).toEqual([1, 3]);
    expect(saved).toHaveLength(0);

    secondSave.resolve(newest);
    await Promise.all([firstDrain, newestDrain]);

    expect(saved.map((encounter) => encounter.log.length)).toEqual([3]);
    expect(savingStates).toEqual([true, false]);
  });
});
