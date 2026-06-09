"use client";

import { Dices, Save } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const hpPercent = useMemo(
    () => Math.max(0, Math.min(100, (encounter.target.currentHp / encounter.target.maxHp) * 100)),
    [encounter.target.currentHp, encounter.target.maxHp],
  );

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
      }
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
        <div className="rounded-lg border border-border bg-card/75 p-5">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Target</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{encounter.target.name}</h2>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            AC {encounter.target.ac} · HP {encounter.target.currentHp}/{encounter.target.maxHp}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-background">
            <div className="h-full bg-primary" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/75 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Party</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">Combatants</h2>
            </div>
            <label className="grid gap-2 text-sm">
              <span className="font-mono text-muted-foreground">Damage mode</span>
              <select
                value={damageMode}
                onChange={(event) => setDamageMode(event.target.value as ResistanceMode)}
                className="field-input"
              >
                <option value="normal">Normal</option>
                <option value="half">Half</option>
                <option value="double">Double</option>
                <option value="immune">Immune</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3">
            {encounter.combatants.map((combatant) => {
              const creature = creatures.find((candidate) => candidate.id === combatant.creatureId);
              const percent = Math.max(0, Math.min(100, (combatant.currentHp / combatant.maxHp) * 100));

              return (
                <article key={combatant.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="grid gap-4 lg:grid-cols-[auto_1fr_220px] lg:items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(combatant.id)}
                        disabled={combatant.currentHp <= 0}
                        onChange={(event) => toggleCombatant(combatant.id, event.target.checked)}
                        className="size-4"
                      />
                      Active
                    </label>
                    <div>
                      <p className="font-semibold">{combatant.instanceName}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        HP {combatant.currentHp}/{combatant.maxHp}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <select
                      value={actionByCombatantId[combatant.id] ?? ""}
                      onChange={(event) => setAction(combatant.id, event.target.value)}
                      className="field-input"
                    >
                      {creature?.actions.map((action) => (
                        <option key={action.name} value={action.name}>
                          {action.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>

          <Button type="button" onClick={runRound} disabled={isSaving} className="mt-5">
            {isSaving ? <Save aria-hidden="true" /> : <Dices aria-hidden="true" />}
            {isSaving ? "Saving" : "Run round"}
          </Button>
        </div>
      </section>

      <aside className="rounded-lg border border-border bg-card/75 p-5">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Combat Log</p>
        <div className="mt-4 grid gap-3">
          {encounter.log.length > 0 ? (
            [...encounter.log].reverse().map((entry) => (
              <p key={entry.id} className="text-sm leading-6 text-muted-foreground">
                {entry.text}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No rounds yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
