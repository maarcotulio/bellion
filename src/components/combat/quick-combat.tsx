"use client";

import { Dices, HeartPulse } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { resolveAttack, resolveDamage, type ResistanceMode } from "@/lib/dice";
import type { Creature, CreatureAction } from "@/lib/schemas/creature";

type QuickCombatProps = {
  readonly creatures: readonly Creature[];
};

type CombatLogEntry = {
  readonly id: string;
  readonly text: string;
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

  const hpPercent = useMemo(() => {
    if (!target) {
      return 0;
    }

    return Math.max(0, Math.min(100, (targetHp / target.hp.average) * 100));
  }, [target, targetHp]);

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
    let text = `${attacker.name} uses ${action.name}: d20 ${attack.roll.total} vs AC ${target.ac.value}. Miss.`;

    if (attack.hit && damageDice) {
      const damage = resolveDamage({
        dice: damageDice,
        critical: attack.critical,
        mode,
      });
      nextHp = Math.max(0, targetHp - damage.total);
      text = `${attacker.name} uses ${action.name}: hit ${attack.roll.total}${
        attack.critical ? " crit" : ""
      }, ${damage.total} damage (${mode}). ${target.name} HP ${nextHp}/${target.hp.average}.`;
    }

    setTargetHp(nextHp);
    setLog((entries) => [{ id: crypto.randomUUID(), text }, ...entries]);
  }

  if (creatures.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/75 p-6">
        <p className="font-display text-2xl font-semibold">No creatures available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid gap-5 rounded-lg border border-border bg-card/75 p-5">
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
          <SelectField label="Damage mode" value={mode} onChange={(value) => setMode(value as ResistanceMode)}>
            <option value="normal">Normal</option>
            <option value="half">Half</option>
            <option value="double">Double</option>
            <option value="immune">Immune</option>
          </SelectField>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={advantage}
              onChange={(event) => setAdvantage(event.target.checked)}
              className="size-4"
            />
            Advantage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disadvantage}
              onChange={(event) => setDisadvantage(event.target.checked)}
              className="size-4"
            />
            Disadvantage
          </label>
        </div>

        <Button type="button" onClick={runAttack}>
          <Dices aria-hidden="true" />
          Resolve attack
        </Button>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-border bg-card/75 p-5">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-display text-2xl font-semibold">{target?.name ?? "Target"}</h2>
          </div>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            HP {targetHp}/{target?.hp.average ?? 0}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-background">
            <div className="h-full bg-primary" style={{ width: `${hpPercent}%` }} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/75 p-5">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Log</p>
          <div className="mt-4 grid gap-3">
            {log.length > 0 ? (
              log.map((entry) => (
                <p key={entry.id} className="text-sm leading-6 text-muted-foreground">
                  {entry.text}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No attacks yet.</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-mono text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      >
        {children}
      </select>
    </label>
  );
}
