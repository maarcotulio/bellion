import { model, models, Schema, type Model } from "mongoose";

import type { Creature } from "@/lib/schemas/creature";

const damageSchema = new Schema(
  {
    dice: { type: String, required: true },
    type: { type: String, required: true },
  },
  { _id: false },
);

const actionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    attackBonus: { type: Number },
    reach: { type: Number },
    range: { type: String },
    damage: { type: [damageSchema] },
    saveDC: { type: Number },
    saveAbility: { type: String },
  },
  { _id: false },
);

const namedDescriptionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const creatureSchema = new Schema<Creature>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    size: { type: String, required: true },
    type: { type: String, required: true, index: true },
    alignment: { type: String, required: true },
    cr: { type: String, required: true, index: true },
    ac: {
      value: { type: Number, required: true },
      type: { type: String },
    },
    hp: {
      average: { type: Number, required: true },
      formula: { type: String, required: true },
    },
    speed: {
      walk: { type: Number },
      burrow: { type: Number },
      climb: { type: Number },
      fly: { type: Number },
      swim: { type: Number },
      hover: { type: Boolean },
    },
    stats: {
      str: { type: Number, required: true },
      dex: { type: Number, required: true },
      con: { type: Number, required: true },
      int: { type: Number, required: true },
      wis: { type: Number, required: true },
      cha: { type: Number, required: true },
    },
    savingThrows: { type: Map, of: Number },
    skills: { type: Map, of: Number },
    damageResistances: { type: [String] },
    damageImmunities: { type: [String] },
    damageVulnerabilities: { type: [String] },
    conditionImmunities: { type: [String] },
    senses: { type: [String], required: true },
    languages: { type: [String], required: true },
    traits: { type: [namedDescriptionSchema], required: true },
    actions: { type: [actionSchema], required: true },
    bonusActions: { type: [actionSchema] },
    reactions: { type: [actionSchema] },
    source: { type: String },
    importedAt: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "creatures",
    versionKey: false,
  },
);

export const CreatureModel =
  (models.Creature as Model<Creature> | undefined) ??
  model<Creature>("Creature", creatureSchema);
