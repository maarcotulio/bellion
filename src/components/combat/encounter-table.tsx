"use client";

import { Dices, Download, Save } from "lucide-react";
import { useRef, useState } from "react";

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
import { createEncounterSaveQueue } from "@/lib/encounters/save-queue";
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
  const encounterRef = useRef(initialEncounter);
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
  const [hpInputByCombatantId, setHpInputByCombatantId] = useState<Readonly<Record<string, string>>>({});
  const [damageMode, setDamageMode] = useState<ResistanceMode>("normal");
  const [targetAcEnabled, setTargetAcEnabled] = useState(true);
  const [targetAc, setTargetAc] = useState("15");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveQueueRef = useRef<ReturnType<typeof createEncounterSaveQueue> | null>(null);

  function commitEncounter(nextEncounter: Encounter) {
    encounterRef.current = nextEncounter;
    setEncounter(nextEncounter);
  }

  if (!saveQueueRef.current) {
    saveQueueRef.current = createEncounterSaveQueue({
      save: saveEncounter,
      onSaved: commitEncounter,
      onError: setSaveError,
      onSavingChange: setIsSaving,
    });
  }

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

  function parsedTargetAc() {
    const parsedValue = Number(targetAc);

    return Number.isFinite(parsedValue) ? Math.max(1, Math.floor(parsedValue)) : 10;
  }

  async function saveEncounter(nextEncounter: Encounter) {
    const response = await fetch(`/api/encounters/${nextEncounter.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextEncounter),
    });
    const data: unknown = await response.json();

    if (!response.ok) {
      throw new Error(errorMessageFromResponse(data));
    }

    if (!isEncounterResponse(data)) {
      throw new Error("Encounter response was invalid.");
    }

    return data.encounter;
  }

  function persist(nextEncounter: Encounter) {
    commitEncounter(nextEncounter);
    void saveQueueRef.current?.enqueue(nextEncounter);
  }

  function updateCombatant(combatantId: string, transform: (combatant: Combatant) => Combatant) {
    const currentEncounter = encounterRef.current;
    const nextEncounter: Encounter = {
      ...currentEncounter,
      combatants: currentEncounter.combatants.map((combatant) =>
        combatant.id === combatantId ? transform(combatant) : combatant,
      ),
      updatedAt: new Date().toISOString(),
    };

    persist(nextEncounter);
  }

  function healCombatant(combatantId: string) {
    const amount = hpInputValue(combatantId);

    updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      currentHp: Math.min(combatant.maxHp, combatant.currentHp + amount),
    }));
  }

  function damageCombatant(combatantId: string) {
    updateCombatant(combatantId, (combatant) =>
      applyDamageToCombatant(combatant, hpInputValue(combatantId)),
    );
  }

  function addTempHp(combatantId: string) {
    const amount = hpInputValue(combatantId);

    updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      tempHp: (combatant.tempHp ?? 0) + amount,
    }));
  }

  function runRound() {
    const nextEncounter = runEncounterRound({
      encounter: encounterRef.current,
      creatures,
      selectedCombatantIds: selectedIds,
      actionByCombatantId,
      targetAcEnabled,
      targetAc: parsedTargetAc(),
      damageMode,
    });

    persist(nextEncounter);
  }

  function errorMessageFromResponse(data: unknown) {
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }

    return "Encounter updated locally but could not be saved.";
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
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[120px_176px] sm:items-end">
              <div className="grid gap-2">
                <CheckboxField
                  id="encounter-target-ac-enabled"
                  label="Target AC"
                  checked={targetAcEnabled}
                  onCheckedChange={setTargetAcEnabled}
                />
                <Input
                  type="number"
                  min={1}
                  value={targetAc}
                  onChange={(event) => setTargetAc(event.target.value)}
                  disabled={!targetAcEnabled}
                  aria-label="Target AC"
                />
              </div>
              <SelectField
                label="Damage mode"
                value={damageMode}
                onChange={(value) => setDamageMode(value as ResistanceMode)}
              >
                <option value="normal">Normal</option>
                <option value="half">Half</option>
                <option value="double">Double</option>
                <option value="immune">Immune</option>
              </SelectField>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {encounter.combatants.map((combatant) => {
              const creature = creatures.find((candidate) => candidate.id === combatant.creatureId);

              return (
                <article
                  key={combatant.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_220px] xl:items-center">
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
              <Button type="button" onClick={runRound}>
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
