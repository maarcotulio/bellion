"use client";

import { Dices } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { CombatLog } from "@/components/ui/combat-log";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { resolveAttack, resolveDamage, rollD20, type ResistanceMode } from "@/lib/dice";
import type { Creature, CreatureAction } from "@/lib/schemas/creature";
import type { CombatLogEntry } from "@/lib/schemas/encounter";

type QuickCombatProps = {
  readonly creatures: readonly Creature[];
};

function firstDamagingAction(creature: Creature | undefined) {
  return creature?.actions.find(
    (action) => action.attacks?.[0] || (action.attackBonus !== undefined && action.damage?.[0]),
  );
}

function findAction(creature: Creature | undefined, actionName: string) {
  return creature?.actions.find((action) => action.name === actionName);
}

function getDamageDice(action: CreatureAction | undefined) {
  return action?.damage?.[0]?.dice;
}

function expandCombatActions(
  selectedAction: CreatureAction,
  availableActions: readonly CreatureAction[],
) {
  if (!selectedAction.attacks || selectedAction.attacks.length === 0) {
    return [selectedAction];
  }

  return selectedAction.attacks.flatMap((attack) => {
    const referencedAction = availableActions.find((candidate) => candidate.name === attack.actionName);

    if (!referencedAction) {
      return [];
    }

    return Array.from({ length: attack.count }, () => referencedAction);
  });
}

export function QuickCombat({ creatures }: QuickCombatProps) {
  const [attackerId, setAttackerId] = useState(creatures[0]?.id ?? "");
  const attacker = creatures.find((creature) => creature.id === attackerId);
  const defaultAction = firstDamagingAction(attacker);
  const [actionName, setActionName] = useState(defaultAction?.name ?? "");
  const action = findAction(attacker, actionName) ?? defaultAction;
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [mode, setMode] = useState<ResistanceMode>("normal");
  const [targetAcEnabled, setTargetAcEnabled] = useState(true);
  const [targetAc, setTargetAc] = useState("15");
  const [log, setLog] = useState<readonly CombatLogEntry[]>([]);

  function handleAttackerChange(nextAttackerId: string) {
    const nextAttacker = creatures.find((creature) => creature.id === nextAttackerId);
    const nextAction = firstDamagingAction(nextAttacker);

    setAttackerId(nextAttackerId);
    setActionName(nextAction?.name ?? "");
  }

  function parsedTargetAc() {
    const parsedValue = Number(targetAc);

    return Number.isFinite(parsedValue) ? Math.max(1, Math.floor(parsedValue)) : 10;
  }

  function runAttack() {
    if (!attacker || !action) {
      return;
    }

    const batchId = `batch-${Date.now()}-${crypto.randomUUID()}`;
    const nextEntries: CombatLogEntry[] = expandCombatActions(action, attacker.actions).flatMap((combatAction) => {
      if (combatAction.attackBonus === undefined) {
        return [];
      }

      const attack = targetAcEnabled
        ? resolveAttack({
            attackBonus: combatAction.attackBonus,
            targetAc: parsedTargetAc(),
            advantage,
            disadvantage,
          })
        : undefined;
      const attackRoll = attack?.roll ?? rollD20({ modifier: combatAction.attackBonus, advantage, disadvantage });
      const damageDice = getDamageDice(combatAction);
      const critical = attack?.critical ?? attackRoll.isCritical;
      const shouldRollDamage = targetAcEnabled ? attack?.hit === true : !attackRoll.isFumble;
      const damage =
        shouldRollDamage && damageDice
          ? resolveDamage({
              dice: damageDice,
              critical,
              mode,
            })
          : undefined;
      const outcome: CombatLogEntry["outcome"] = critical
        ? "critical"
        : attackRoll.isFumble
          ? "fumble"
          : targetAcEnabled
            ? attack?.hit
              ? "hit"
              : "miss"
            : "roll";

      return [
        {
          id: crypto.randomUUID(),
          batchId,
          createdAt: new Date().toISOString(),
          attackerName: attacker.name,
          targetName: "Target",
          targetAc: targetAcEnabled ? parsedTargetAc() : undefined,
          actionName: combatAction.name,
          outcome,
          toHit: {
            expression: "1d20",
            rolls: [...attackRoll.rolls],
            modifier: attackRoll.modifier,
            total: attackRoll.total,
          },
          damage: damage
            ? {
                expression: damage.dice,
                rolls: [...damage.rolls],
                modifier: damage.modifier,
                rawTotal: damage.rawTotal,
                total: damage.total,
                mode: damage.mode,
                type: combatAction.damage?.[0]?.type ?? "damage",
              }
            : undefined,
        },
      ];
    });

    setLog((entries) => [...nextEntries, ...entries]);
  }

  if (creatures.length === 0) {
    return (
      <EmptyState
        title="No creatures available"
        description="Create or import creatures before running quick combat."
      >
        <Button asChild>
          <Link href="/library">Open library</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/import">Import JSON</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="self-start">
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Quick Combat</p>
          <CardTitle>Resolve Attack</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Attacker" value={attackerId} onChange={handleAttackerChange}>
              {creatures.map((creature) => (
                <option key={creature.id} value={creature.id}>
                  {creature.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Action" value={action?.name ?? ""} onChange={setActionName}>
              {attacker?.actions.map((creatureAction) => (
                <option key={creatureAction.name} value={creatureAction.name}>
                  {creatureAction.name}
                </option>
              ))}
            </SelectField>
            <SelectField
                label="Damage mode"
                value={mode}
                onChange={(value) => setMode(value as ResistanceMode)}
              >
                <option value="normal">Normal</option>
                <option value="half">Half</option>
                <option value="double">Double</option>
                <option value="immune">Immune</option>
              </SelectField>
            <div className="grid gap-2">
              <CheckboxField
                id="quick-target-ac-enabled"
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
          </div>

          <div className="flex flex-wrap gap-6">
            <CheckboxField
              id="quick-advantage"
              label="Advantage"
              checked={advantage}
              onCheckedChange={setAdvantage}
            />
            <CheckboxField
              id="quick-disadvantage"
              label="Disadvantage"
              checked={disadvantage}
              onCheckedChange={setDisadvantage}
            />
          </div>

          <Button type="button" onClick={runAttack}>
            <Dices aria-hidden="true" />
            Resolve attack
          </Button>
        </CardContent>
      </Card>

      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Log</p>
            <CardTitle>Battle Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <CombatLog
              entries={log}
              emptyMessage="No attacks yet."
              className="max-h-[18rem] overflow-y-auto pr-2"
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
