"use client";

import { Dices, Download, Save } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { CombatLog } from "@/components/ui/combat-log";
import { HpBar } from "@/components/ui/hp-bar";
import { SelectField } from "@/components/ui/select-field";
import { runEncounterRound } from "@/lib/combat/encounter-round";
import type { ResistanceMode } from "@/lib/dice";
import type { Creature } from "@/lib/schemas/creature";
import { EncounterSchema, type Encounter } from "@/lib/schemas/encounter";

type EncounterTableProps = {
  readonly initialEncounter: Encounter;
  readonly creatures: readonly Creature[];
};

type EncounterResponse = {
  readonly encounter: Encounter;
};

function isEncounterResponse(value: unknown): value is EncounterResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "encounter" in value &&
    EncounterSchema.safeParse(value.encounter).success
  );
}

function defaultActionName(creature: Creature | undefined) {
  return creature?.actions.find((action) => action.attackBonus !== undefined && action.damage?.[0])?.name ?? "";
}

function downloadEncounter(encounter: Encounter) {
  const blob = new Blob([JSON.stringify(encounter, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${encounter.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EncounterTable({ initialEncounter, creatures }: EncounterTableProps) {
  const [encounter, setEncounter] = useState(initialEncounter);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(
    initialEncounter.combatants
      .filter((combatant) => combatant.isActive && combatant.currentHp > 0)
      .map((combatant) => combatant.id),
  );
  const [actionByCombatantId, setActionByCombatantId] = useState<Readonly<Record<string, string>>>(
    Object.fromEntries(
      initialEncounter.combatants.map((combatant) => {
        const creature = creatures.find((candidate) => candidate.id === combatant.creatureId);

        return [combatant.id, defaultActionName(creature)];
      }),
    ),
  );
  const [damageMode, setDamageMode] = useState<ResistanceMode>("normal");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleCombatant(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((combatantId) => combatantId !== id),
    );
  }

  function setAction(combatantId: string, actionName: string) {
    setActionByCombatantId((current) => ({
      ...current,
      [combatantId]: actionName,
    }));
  }

  async function persist(nextEncounter: Encounter) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/encounters/${encounter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextEncounter),
      });
      const data: unknown = await response.json();

      if (response.ok && isEncounterResponse(data)) {
        setEncounter(data.encounter);
      } else {
        setEncounter(nextEncounter);
        setSaveError("Encounter updated locally but could not be saved.");
      }
    } catch {
      setEncounter(nextEncounter);
      setSaveError("Encounter updated locally but could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runRound() {
    const nextEncounter = runEncounterRound({
      encounter,
      creatures,
      selectedCombatantIds: selectedIds,
      actionByCombatantId,
      damageMode,
    });

    await persist(nextEncounter);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Target</p>
            <CardTitle>{encounter.target.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground">
              AC {encounter.target.ac} · HP {encounter.target.currentHp}/{encounter.target.maxHp}
            </p>
            <HpBar
              current={encounter.target.currentHp}
              max={encounter.target.maxHp}
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Party</p>
              <CardTitle>Combatants</CardTitle>
            </div>
            <SelectField
              label="Damage mode"
              value={damageMode}
              onChange={(value) => setDamageMode(value as ResistanceMode)}
              className="w-full sm:w-44"
            >
              <option value="normal">Normal</option>
              <option value="half">Half</option>
              <option value="double">Double</option>
              <option value="immune">Immune</option>
            </SelectField>
          </CardHeader>
          <CardContent className="grid gap-3">
            {encounter.combatants.map((combatant) => {
              const creature = creatures.find((candidate) => candidate.id === combatant.creatureId);

              return (
                <article
                  key={combatant.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[auto_1fr_220px] lg:items-center">
                    <CheckboxField
                      id={`combatant-${combatant.id}`}
                      label="Active"
                      checked={selectedIds.includes(combatant.id)}
                      disabled={combatant.currentHp <= 0}
                      onCheckedChange={(checked) => toggleCombatant(combatant.id, checked)}
                    />
                    <div>
                      <p className="font-semibold">{combatant.instanceName}</p>
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
                    <SelectField
                      label="Action"
                      value={actionByCombatantId[combatant.id] ?? ""}
                      onChange={(value) => setAction(combatant.id, value)}
                    >
                      {creature?.actions.map((action) => (
                        <option key={action.name} value={action.name}>
                          {action.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </article>
              );
            })}

            {saveError ? (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={runRound} disabled={isSaving}>
                {isSaving ? <Save aria-hidden="true" /> : <Dices aria-hidden="true" />}
                {isSaving ? "Saving" : "Run round"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => downloadEncounter(encounter)}>
                <Download aria-hidden="true" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Combat Log</p>
          <CardTitle>Battle Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <CombatLog
            entries={[...encounter.log].reverse()}
            emptyMessage="No rounds yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
