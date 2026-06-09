import { z } from "zod";

export const CreatureSizeSchema = z.enum([
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
]);

export const CreatureTypeSchema = z.enum([
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead",
]);

export const AbilitySchema = z.enum(["str", "dex", "con", "int", "wis", "cha"]);

export const ChallengeRatingSchema = z.enum([
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
]);

export const DamageTypeSchema = z.enum([
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
]);

export const ConditionSchema = z.enum([
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
]);

const DiceExpressionSchema = z
  .string()
  .regex(/^\d+d\d+([+-]\d+)?$/, "Expected dice expression like 2d6+3.");

const ModifierSchema = z.number().int();

const ScoreSchema = z.number().int().min(1).max(30);

const NamedDescriptionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export const CreatureActionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    attackBonus: ModifierSchema.optional(),
    reach: z.number().int().positive().optional(),
    range: z.string().min(1).optional(),
    damage: z
      .array(
        z
          .object({
            dice: DiceExpressionSchema,
            type: DamageTypeSchema,
          })
          .strict(),
      )
      .optional(),
    saveDC: z.number().int().positive().optional(),
    saveAbility: AbilitySchema.optional(),
  })
  .strict();

export const CreatureSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    size: CreatureSizeSchema,
    type: CreatureTypeSchema,
    alignment: z.string().min(1),
    cr: ChallengeRatingSchema,
    ac: z
      .object({
        value: z.number().int().positive(),
        type: z.string().min(1).optional(),
      })
      .strict(),
    hp: z
      .object({
        average: z.number().int().positive(),
        formula: DiceExpressionSchema,
      })
      .strict(),
    speed: z
      .object({
        walk: z.number().int().positive().optional(),
        burrow: z.number().int().positive().optional(),
        climb: z.number().int().positive().optional(),
        fly: z.number().int().positive().optional(),
        swim: z.number().int().positive().optional(),
        hover: z.boolean().optional(),
      })
      .strict(),
    stats: z
      .object({
        str: ScoreSchema,
        dex: ScoreSchema,
        con: ScoreSchema,
        int: ScoreSchema,
        wis: ScoreSchema,
        cha: ScoreSchema,
      })
      .strict(),
    savingThrows: z.record(AbilitySchema, ModifierSchema).optional(),
    skills: z.record(z.string().min(1), ModifierSchema).optional(),
    damageResistances: z.array(DamageTypeSchema).optional(),
    damageImmunities: z.array(DamageTypeSchema).optional(),
    damageVulnerabilities: z.array(DamageTypeSchema).optional(),
    conditionImmunities: z.array(ConditionSchema).optional(),
    senses: z.array(z.string().min(1)).min(1),
    languages: z.array(z.string().min(1)),
    traits: z.array(NamedDescriptionSchema),
    actions: z.array(CreatureActionSchema).min(1),
    bonusActions: z.array(CreatureActionSchema).optional(),
    reactions: z.array(CreatureActionSchema).optional(),
    source: z.enum(["manual", "import", "fixture"]).optional(),
    importedAt: z.string().datetime({ offset: true }).optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type Creature = z.infer<typeof CreatureSchema>;
export type CreatureAction = z.infer<typeof CreatureActionSchema>;
export type CreatureSize = z.infer<typeof CreatureSizeSchema>;
export type CreatureType = z.infer<typeof CreatureTypeSchema>;
export type ChallengeRating = z.infer<typeof ChallengeRatingSchema>;
export type DamageType = z.infer<typeof DamageTypeSchema>;
