"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Creature } from "@/lib/schemas/creature";
import { EncounterSchema, type Combatant, type Encounter } from "@/lib/schemas/encounter";

type EncounterFormProps = {
  readonly creatures: readonly Creature[];
};

type EncounterResponse = {
  readonly encounter: Encounter;
};

function createId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isEncounterResponse(value: unknown): value is EncounterResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "encounter" in value &&
    EncounterSchema.safeParse(value.encounter).success
  );
}

export function EncounterForm({ creatures }: EncounterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("New Encounter");
  const [targetCreatureId, setTargetCreatureId] = useState(creatures[0]?.id ?? "");
  const [combatantCreatureId, setCombatantCreatureId] = useState(creatures[0]?.id ?? "");
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const targetCreature = creatures.find((creature) => creature.id === targetCreatureId);

  function addCombatant() {
    const creature = creatures.find((candidate) => candidate.id === combatantCreatureId);

    if (!creature) {
      return;
    }

    const count = combatants.filter((combatant) => combatant.creatureId === creature.id).length + 1;

    setCombatants((current) => [
      ...current,
      {
        id: `${creature.id}-${crypto.randomUUID()}`,
        creatureId: creature.id,
        instanceName: `${creature.name} #${count}`,
        currentHp: creature.hp.average,
        maxHp: creature.hp.average,
        conditions: [],
        isActive: true,
      },
    ]);
  }

  function removeCombatant(id: string) {
    setCombatants((current) => current.filter((combatant) => combatant.id !== id));
  }

  async function saveEncounter() {
    setError(null);

    if (!targetCreature) {
      setError("Pick target creature.");
      return;
    }

    if (combatants.length === 0) {
      setError("Add at least one combatant.");
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const payload: Encounter = {
        id: createId(name),
        name,
        target: {
          name: targetCreature.name,
          ac: targetCreature.ac.value,
          currentHp: targetCreature.hp.average,
          maxHp: targetCreature.hp.average,
        },
        combatants: [...combatants],
        log: [],
        createdAt: now,
        updatedAt: now,
      };
      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Encounter could not be saved.");
      }

      if (!isEncounterResponse(data)) {
        throw new Error("Encounter response was invalid.");
      }

      router.push(`/combat/${data.encounter.id}`);
      router.refresh();
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : "Encounter could not be saved.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid gap-5 rounded-lg border border-border bg-card/75 p-5">
        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm">
            {error}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm">
          <span className="font-mono text-muted-foreground">Encounter name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} className="field-input" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-mono text-muted-foreground">Target</span>
          <select
            value={targetCreatureId}
            onChange={(event) => setTargetCreatureId(event.target.value)}
            className="field-input"
          >
            {creatures.map((creature) => (
              <option key={creature.id} value={creature.id}>
                {creature.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm">
            <span className="font-mono text-muted-foreground">Combatant</span>
            <select
              value={combatantCreatureId}
              onChange={(event) => setCombatantCreatureId(event.target.value)}
              className="field-input"
            >
              {creatures.map((creature) => (
                <option key={creature.id} value={creature.id}>
                  {creature.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" onClick={addCombatant} className="w-full sm:w-auto">
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>
        <Button type="button" onClick={saveEncounter} disabled={isSaving}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving" : "Create encounter"}
        </Button>
      </section>

      <aside className="rounded-lg border border-border bg-card/75 p-5">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Party</p>
        <div className="mt-4 grid gap-3">
          {combatants.length > 0 ? (
            combatants.map((combatant) => (
              <div key={combatant.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
                <div>
                  <p className="font-medium">{combatant.instanceName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    HP {combatant.currentHp}/{combatant.maxHp}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCombatant(combatant.id)}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No combatants yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
