import { z } from "zod";

export const EncounterTargetSchema = z
  .object({
    name: z.string().min(1),
    ac: z.number().int().positive(),
    currentHp: z.number().int().min(0),
    maxHp: z.number().int().positive(),
  })
  .strict();

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

export const CombatLogEntrySchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.string().datetime({ offset: true }),
    text: z.string().min(1),
  })
  .strict();

export const EncounterSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    target: EncounterTargetSchema,
    combatants: z.array(CombatantSchema).min(1),
    log: z.array(CombatLogEntrySchema),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type Encounter = z.infer<typeof EncounterSchema>;
export type Combatant = z.infer<typeof CombatantSchema>;
export type EncounterTarget = z.infer<typeof EncounterTargetSchema>;
export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;
