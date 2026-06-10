import { connectToMongo } from "@/lib/db/mongoose";
import { EncounterModel } from "@/lib/db/models/encounter";
import { EncounterSchema, type Encounter } from "@/lib/schemas/encounter";

function toEncounter(value: unknown) {
  return EncounterSchema.parse(value);
}

function toEncounterOrNull(value: unknown) {
  const result = EncounterSchema.safeParse(value);

  return result.success ? result.data : null;
}

export async function listEncounters() {
  await connectToMongo();

  const documents = await EncounterModel.find({}, { _id: 0 }).sort({ updatedAt: -1 }).lean().exec();

  return documents.flatMap((document) => {
    const encounter = toEncounterOrNull(document);

    return encounter ? [encounter] : [];
  });
}

export async function getEncounter(id: string) {
  await connectToMongo();

  const document = await EncounterModel.findOne({ id }, { _id: 0 }).lean().exec();

  return document ? toEncounterOrNull(document) : null;
}

export async function createEncounter(input: Encounter) {
  await connectToMongo();
  await EncounterModel.create(input);

  return input;
}

export async function updateEncounter(id: string, input: Encounter) {
  await connectToMongo();

  const document = await EncounterModel.findOneAndUpdate({ id }, input, {
    projection: { _id: 0 },
    returnDocument: "after",
    runValidators: true,
  })
    .lean()
    .exec();

  return document ? toEncounter(document) : null;
}

export async function deleteEncounter(id: string) {
  await connectToMongo();

  const result = await EncounterModel.deleteOne({ id }).exec();

  return result.deletedCount > 0;
}
