"use client";

import { Dices, HeartPulse } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { CombatLog } from "@/components/ui/combat-log";
import { EmptyState } from "@/components/ui/empty-state";
import { HpBar } from "@/components/ui/hp-bar";
import { SelectField } from "@/components/ui/select-field";
import { resolveAttack, resolveDamage, type ResistanceMode } from "@/lib/dice";
import type { Creature, CreatureAction } from "@/lib/schemas/creature";
import type { CombatLogEntry } from "@/lib/schemas/encounter";

type QuickCombatProps = {
  readonly creatures: readonly Creature[];
};

function firstDamagingAction(creature: Creature | undefined) {
  return creature?.actions.find((action) => action.attackBonus !== undefined && action.damage?.[0]);
}

function findAction(creature: Creature | undefined, actionName: string) {
  return creature?.actions.find((action) => action.name === actionName);
}

function getDamageDice(action: CreatureAction | undefined) {
  return action?.damage?.[0]?.dice;
}

export function QuickCombat({ creatures }: QuickCombatProps) {
  const [attackerId, setAttackerId] = useState(creatures[0]?.id ?? "");
  const [targetId, setTargetId] = useState(creatures[1]?.id ?? creatures[0]?.id ?? "");
  const attacker = creatures.find((creature) => creature.id === attackerId);
  const target = creatures.find((creature) => creature.id === targetId);
  const defaultAction = firstDamagingAction(attacker);
  const [actionName, setActionName] = useState(defaultAction?.name ?? "");
  const action = findAction(attacker, actionName) ?? defaultAction;
  const [targetHp, setTargetHp] = useState(target?.hp.average ?? 0);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [mode, setMode] = useState<ResistanceMode>("normal");
  const [log, setLog] = useState<readonly CombatLogEntry[]>([]);

  function handleTargetChange(nextTargetId: string) {
    const nextTarget = creatures.find((creature) => creature.id === nextTargetId);

    setTargetId(nextTargetId);
    setTargetHp(nextTarget?.hp.average ?? 0);
  }

  function handleAttackerChange(nextAttackerId: string) {
    const nextAttacker = creatures.find((creature) => creature.id === nextAttackerId);
    const nextAction = firstDamagingAction(nextAttacker);

    setAttackerId(nextAttackerId);
    setActionName(nextAction?.name ?? "");
  }

  function runAttack() {
    if (!attacker || !target || !action || action.attackBonus === undefined) {
      return;
    }

    const attack = resolveAttack({
      attackBonus: action.attackBonus,
      targetAc: target.ac.value,
      advantage,
      disadvantage,
    });
    const damageDice = getDamageDice(action);
    let nextHp = targetHp;
    const damage =
      attack.hit && damageDice
        ? resolveDamage({
            dice: damageDice,
            critical: attack.critical,
            mode,
          })
        : undefined;

    if (damage) {
      nextHp = Math.max(0, targetHp - damage.total);
    }

    setTargetHp(nextHp);
    setLog((entries) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        attackerName: attacker.name,
        targetName: target.name,
        actionName: action.name,
        outcome: attack.critical ? "critical" : attack.hit ? "hit" : "miss",
        toHit: {
          expression: "1d20",
          rolls: [...attack.roll.rolls],
          modifier: attack.roll.modifier,
          total: attack.roll.total,
        },
        damage: damage
          ? {
              expression: damage.dice,
              rolls: [...damage.rolls],
              modifier: damage.modifier,
              rawTotal: damage.rawTotal,
              total: damage.total,
              mode: damage.mode,
              type: action.damage?.[0]?.type ?? "damage",
            }
          : undefined,
      },
      ...entries,
    ]);
  }

  if (creatures.length === 0) {
    return (
      <EmptyState
        icon={HeartPulse}
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
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
            <SelectField label="Target" value={targetId} onChange={handleTargetChange}>
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
            <div className="flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>{target?.name ?? "Target"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground">
              HP {targetHp}/{target?.hp.average ?? 0}
            </p>
            <HpBar current={targetHp} max={target?.hp.average ?? 1} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Log</p>
            <CardTitle>Battle Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <CombatLog entries={log} emptyMessage="No attacks yet." />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
