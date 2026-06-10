"use client";

import { Dices, Download, Save } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { CombatLog } from "@/components/ui/combat-log";
import { HpBar } from "@/components/ui/hp-bar";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { applyDamageToCombatant, runEncounterRound } from "@/lib/combat/encounter-round";
import type { ResistanceMode } from "@/lib/dice";
import type { Creature } from "@/lib/schemas/creature";
import { EncounterSchema, type Combatant, type Encounter } from "@/lib/schemas/encounter";

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

function defaultTargetId(combatantId: string, combatants: readonly Combatant[]) {
  return combatants.find((combatant) => combatant.id !== combatantId && combatant.currentHp > 0)?.id ?? "";
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
  const [targetByCombatantId, setTargetByCombatantId] = useState<Readonly<Record<string, string>>>(
    Object.fromEntries(
      initialEncounter.combatants.map((combatant) => [
        combatant.id,
        defaultTargetId(combatant.id, initialEncounter.combatants),
      ]),
    ),
  );
  const [hpInputByCombatantId, setHpInputByCombatantId] = useState<Readonly<Record<string, string>>>({});
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

  function setTarget(combatantId: string, targetId: string) {
    setTargetByCombatantId((current) => ({
      ...current,
      [combatantId]: targetId,
    }));
  }

  function setHpInput(combatantId: string, value: string) {
    setHpInputByCombatantId((current) => ({
      ...current,
      [combatantId]: value,
    }));
  }

  function hpInputValue(combatantId: string) {
    const rawValue = hpInputByCombatantId[combatantId] ?? "1";
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : 0;
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

  async function updateCombatant(combatantId: string, transform: (combatant: Combatant) => Combatant) {
    const nextEncounter: Encounter = {
      ...encounter,
      combatants: encounter.combatants.map((combatant) =>
        combatant.id === combatantId ? transform(combatant) : combatant,
      ),
      updatedAt: new Date().toISOString(),
    };

    await persist(nextEncounter);
  }

  async function healCombatant(combatantId: string) {
    const amount = hpInputValue(combatantId);

    await updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      currentHp: Math.min(combatant.maxHp, combatant.currentHp + amount),
    }));
  }

  async function damageCombatant(combatantId: string) {
    await updateCombatant(combatantId, (combatant) =>
      applyDamageToCombatant(combatant, hpInputValue(combatantId)),
    );
  }

  async function addTempHp(combatantId: string) {
    const amount = hpInputValue(combatantId);

    await updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      tempHp: (combatant.tempHp ?? 0) + amount,
    }));
  }

  async function runRound() {
    const nextEncounter = runEncounterRound({
      encounter,
      creatures,
      selectedCombatantIds: selectedIds,
      actionByCombatantId,
      targetByCombatantId,
      damageMode,
    });

    await persist(nextEncounter);
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="grid gap-4">
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
                  <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_180px_180px] xl:items-center">
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
                        HP {combatant.currentHp}/{combatant.maxHp} · Temp {combatant.tempHp ?? 0}
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
                    <SelectField
                      label="Target"
                      value={targetByCombatantId[combatant.id] ?? ""}
                      onChange={(value) => setTarget(combatant.id, value)}
                    >
                      <option value="">None</option>
                      {encounter.combatants
                        .filter((candidate) => candidate.id !== combatant.id)
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.instanceName}
                          </option>
                        ))}
                    </SelectField>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-[120px_repeat(3,minmax(0,1fr))]">
                    <Input
                      type="number"
                      min={0}
                      value={hpInputByCombatantId[combatant.id] ?? "1"}
                      onChange={(event) => setHpInput(combatant.id, event.target.value)}
                      aria-label={`${combatant.instanceName} hit point amount`}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => healCombatant(combatant.id)}
                      disabled={isSaving}
                    >
                      Heal
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => damageCombatant(combatant.id)}
                      disabled={isSaving}
                    >
                      Damage
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => addTempHp(combatant.id)}
                      disabled={isSaving}
                    >
                      Temp HP
                    </Button>
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
            className="max-h-[34rem] overflow-y-auto pr-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}
