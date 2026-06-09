import { resolveAttack, resolveDamage, type RandomSource, type ResistanceMode } from "@/lib/dice";
import type { Creature } from "@/lib/schemas/creature";
import type { Encounter } from "@/lib/schemas/encounter";

type RunEncounterRoundInput = {
  readonly encounter: Encounter;
  readonly creatures: readonly Creature[];
  readonly selectedCombatantIds: readonly string[];
  readonly actionByCombatantId: Readonly<Record<string, string>>;
  readonly damageMode: ResistanceMode;
  readonly random?: RandomSource;
};

function createLogId(index: number) {
  return `log-${Date.now()}-${index}`;
}

export function runEncounterRound({
  encounter,
  creatures,
  selectedCombatantIds,
  actionByCombatantId,
  damageMode,
  random,
}: RunEncounterRoundInput): Encounter {
  let currentHp = encounter.target.currentHp;
  const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
  const selectedIds = new Set(selectedCombatantIds);
  const log = [...encounter.log];
  let logIndex = 0;

  for (const combatant of encounter.combatants) {
    if (!selectedIds.has(combatant.id) || !combatant.isActive || combatant.currentHp <= 0) {
      continue;
    }

    const creature = creatureById.get(combatant.creatureId);
    const actionName = actionByCombatantId[combatant.id];
    const action =
      creature?.actions.find((candidate) => candidate.name === actionName) ??
      creature?.actions.find((candidate) => candidate.attackBonus !== undefined && candidate.damage?.[0]);

    if (!creature || !action || action.attackBonus === undefined) {
      continue;
    }

    const attack = resolveAttack({
      attackBonus: action.attackBonus,
      targetAc: encounter.target.ac,
      random,
    });
    const damageDice = action.damage?.[0]?.dice;
    let text = `${combatant.instanceName} used ${action.name}: attack ${attack.roll.total} miss.`;

    if (attack.hit && damageDice) {
      const damage = resolveDamage({
        dice: damageDice,
        critical: attack.critical,
        mode: damageMode,
        random,
      });
      currentHp = Math.max(0, currentHp - damage.total);
      text = `${combatant.instanceName} used ${action.name}: attack ${attack.roll.total} hit, ${damage.total} damage. Target HP ${currentHp}/${encounter.target.maxHp}.`;
    }

    log.push({
      id: createLogId(logIndex),
      createdAt: new Date().toISOString(),
      text,
    });
    logIndex += 1;
  }

  return {
    ...encounter,
    target: {
      ...encounter.target,
      currentHp,
    },
    log,
    updatedAt: new Date().toISOString(),
  };
}
