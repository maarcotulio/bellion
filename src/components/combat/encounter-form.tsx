"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HpBar } from "@/components/ui/hp-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
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
  const [combatantCreatureId, setCombatantCreatureId] = useState(creatures[0]?.id ?? "");
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        tempHp: 0,
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

  if (creatures.length === 0) {
    return (
      <EmptyState
        title="No creatures available"
        description="Add creatures to the library before building an encounter."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Encounter Builder</p>
          <CardTitle>New Encounter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="encounter-name" className="font-mono text-muted-foreground">
              Encounter name
            </Label>
            <Input
              id="encounter-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <SelectField
              label="Combatant"
              value={combatantCreatureId}
              onChange={setCombatantCreatureId}
            >
              {creatures.map((creature) => (
                <option key={creature.id} value={creature.id}>
                  {creature.name}
                </option>
              ))}
            </SelectField>
            <Button type="button" onClick={addCombatant} className="w-full sm:w-auto">
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
          <Button type="button" onClick={saveEncounter} disabled={isSaving}>
            <Save aria-hidden="true" />
            {isSaving ? "Saving" : "Create encounter"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Party</p>
          <CardTitle>Combatants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {combatants.length > 0 ? (
            combatants.map((combatant) => (
              <div
                key={combatant.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{combatant.instanceName}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    HP {combatant.currentHp}/{combatant.maxHp}
                  </p>
                  <HpBar
                    current={combatant.currentHp}
                    max={combatant.maxHp}
                    size="sm"
                    className="mt-2"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCombatant(combatant.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No combatants yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
