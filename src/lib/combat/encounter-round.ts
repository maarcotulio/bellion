import { resolveAttack, resolveDamage, type RandomSource, type ResistanceMode } from "@/lib/dice";
import type { Creature } from "@/lib/schemas/creature";
import type { Combatant, Encounter } from "@/lib/schemas/encounter";

type RunEncounterRoundInput = {
  readonly encounter: Encounter;
  readonly creatures: readonly Creature[];
  readonly selectedCombatantIds: readonly string[];
  readonly actionByCombatantId: Readonly<Record<string, string>>;
  readonly targetByCombatantId: Readonly<Record<string, string>>;
  readonly damageMode: ResistanceMode;
  readonly random?: RandomSource;
};

function createLogId(index: number) {
  return `log-${Date.now()}-${index}`;
}

export function applyDamageToCombatant(combatant: Combatant, damage: number): Combatant {
  const currentTempHp = combatant.tempHp ?? 0;
  const absorbedByTemp = Math.min(currentTempHp, damage);
  const remainingDamage = damage - absorbedByTemp;

  return {
    ...combatant,
    tempHp: currentTempHp - absorbedByTemp,
    currentHp: Math.max(0, combatant.currentHp - remainingDamage),
  };
}

export function runEncounterRound({
  encounter,
  creatures,
  selectedCombatantIds,
  actionByCombatantId,
  targetByCombatantId,
  damageMode,
  random,
}: RunEncounterRoundInput): Encounter {
  const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
  const selectedIds = new Set(selectedCombatantIds);
  let combatants = [...encounter.combatants];
  const log = [...encounter.log];
  let logIndex = 0;

  for (const combatant of combatants) {
    if (!selectedIds.has(combatant.id) || !combatant.isActive || combatant.currentHp <= 0) {
      continue;
    }

    const creature = creatureById.get(combatant.creatureId);
    const actionName = actionByCombatantId[combatant.id];
    const targetId = targetByCombatantId[combatant.id];
    const target = combatants.find((candidate) => candidate.id === targetId);
    const targetCreature = creatures.find((candidate) => candidate.id === target?.creatureId);
    const action =
      creature?.actions.find((candidate) => candidate.name === actionName) ??
      creature?.actions.find((candidate) => candidate.attackBonus !== undefined && candidate.damage?.[0]);

    if (!creature || !action || action.attackBonus === undefined || !target || !targetCreature) {
      continue;
    }

    const attack = resolveAttack({
      attackBonus: action.attackBonus,
      targetAc: targetCreature.ac.value,
      random,
    });
    const damageDice = action.damage?.[0]?.dice;
    const damageType = action.damage?.[0]?.type ?? "damage";
    const damage =
      attack.hit && damageDice
        ? resolveDamage({
            dice: damageDice,
            critical: attack.critical,
            mode: damageMode,
            random,
          })
        : undefined;

    if (damage) {
      combatants = combatants.map((candidate) =>
        candidate.id === target.id ? applyDamageToCombatant(candidate, damage.total) : candidate,
      );
    }

    log.push({
      id: createLogId(logIndex),
      createdAt: new Date().toISOString(),
      attackerName: combatant.instanceName,
      targetName: target.instanceName,
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
            type: damageType,
          }
        : undefined,
    });
    logIndex += 1;
  }

  return {
    ...encounter,
    combatants,
    log,
    updatedAt: new Date().toISOString(),
  };
}
