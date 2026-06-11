import { model, models, Schema, type Model } from "mongoose";

import type { Encounter } from "@/lib/schemas/encounter";

const combatantSchema = new Schema(
  {
    id: { type: String, required: true },
    creatureId: { type: String, required: true },
    instanceName: { type: String, required: true },
    currentHp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    tempHp: { type: Number },
    conditions: { type: [String], required: true },
    initiative: { type: Number },
    isActive: { type: Boolean, required: true },
  },
  { _id: false },
);

const logEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    batchId: { type: String },
    createdAt: { type: String, required: true },
    attackerName: { type: String, required: true },
    targetName: { type: String, required: true },
    targetAc: { type: Number },
    actionName: { type: String, required: true },
    outcome: { type: String, required: true, enum: ["hit", "miss", "critical", "roll", "fumble"] },
    toHit: {
      expression: { type: String, required: true },
      rolls: { type: [Number], required: true },
      modifier: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    damage: {
      expression: { type: String },
      rolls: { type: [Number] },
      modifier: { type: Number },
      total: { type: Number },
      type: { type: String },
      mode: { type: String, enum: ["normal", "half", "double", "immune"] },
      rawTotal: { type: Number },
    },
  },
  { _id: false },
);

const encounterSchema = new Schema<Encounter>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    combatants: { type: [combatantSchema], required: true },
    log: { type: [logEntrySchema], required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "encounters",
    versionKey: false,
  },
);

export const EncounterModel =
  (models.Encounter as Model<Encounter> | undefined) ??
  model<Encounter>("Encounter", encounterSchema);
