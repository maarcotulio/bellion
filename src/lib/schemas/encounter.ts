import { z } from "zod";

export const CombatantSchema = z
  .object({
    id: z.string().min(1),
    creatureId: z.string().min(1),
    instanceName: z.string().min(1),
    currentHp: z.number().int().min(0),
    maxHp: z.number().int().positive(),
    tempHp: z.number().int().min(0).optional(),
    conditions: z.array(z.string().min(1)),
    initiative: z.number().int().optional(),
    isActive: z.boolean(),
  })
  .strict();

export const CombatLogRollSchema = z
  .object({
    expression: z.string().min(1),
    rolls: z.array(z.number().int().positive()),
    modifier: z.number().int(),
    total: z.number().int(),
  })
  .strict();

export const CombatLogDamageSchema = CombatLogRollSchema.extend({
  type: z.string().min(1),
  mode: z.enum(["normal", "half", "double", "immune"]),
  rawTotal: z.number().int().min(0),
});

export const CombatLogEntrySchema = z
  .object({
    id: z.string().min(1),
    batchId: z.string().min(1).optional(),
    createdAt: z.string().datetime({ offset: true }),
    attackerName: z.string().min(1),
    targetName: z.string().min(1),
    targetAc: z.number().int().positive().optional(),
    actionName: z.string().min(1),
    outcome: z.enum(["hit", "miss", "critical", "roll", "fumble"]),
    toHit: CombatLogRollSchema,
    damage: CombatLogDamageSchema.optional(),
  })
  .strict();

export const EncounterSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    combatants: z.array(CombatantSchema).min(1),
    log: z.array(CombatLogEntrySchema),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type Encounter = z.infer<typeof EncounterSchema>;
export type Combatant = z.infer<typeof CombatantSchema>;
export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;
