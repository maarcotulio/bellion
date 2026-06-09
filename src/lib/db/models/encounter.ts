import { model, models, Schema, type Model } from "mongoose";

import type { Encounter } from "@/lib/schemas/encounter";

const targetSchema = new Schema(
  {
    name: { type: String, required: true },
    ac: { type: Number, required: true },
    currentHp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
  },
  { _id: false },
);

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
    createdAt: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const encounterSchema = new Schema<Encounter>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    target: { type: targetSchema, required: true },
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
