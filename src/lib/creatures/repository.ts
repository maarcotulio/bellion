import { connectToMongo } from "@/lib/db/mongoose";
import { CreatureModel } from "@/lib/db/models/creature";
import {
  ChallengeRatingSchema,
  CreatureSchema,
  CreatureTypeSchema,
  type Creature,
} from "@/lib/schemas/creature";

type CreatureFilters = {
  readonly search?: string;
  readonly type?: string;
  readonly cr?: string;
};

function toCreature(value: unknown) {
  return CreatureSchema.parse(value);
}

function createQuery(filters: CreatureFilters) {
  const query: {
    name?: RegExp;
    type?: Creature["type"];
    cr?: Creature["cr"];
  } = {};

  if (filters.search) {
    query.name = new RegExp(filters.search, "i");
  }

  const creatureType = CreatureTypeSchema.safeParse(filters.type);

  if (creatureType.success) {
    query.type = creatureType.data;
  }

  const challengeRating = ChallengeRatingSchema.safeParse(filters.cr);

  if (challengeRating.success) {
    query.cr = challengeRating.data;
  }

  return query;
}

export async function listCreatures(filters: CreatureFilters = {}) {
  await connectToMongo();

  const documents = await CreatureModel.find(createQuery(filters), { _id: 0 })
    .sort({ name: 1 })
    .lean()
    .exec();

  return documents.map(toCreature);
}

export async function getCreature(id: string) {
  await connectToMongo();

  const document = await CreatureModel.findOne({ id }, { _id: 0 }).lean().exec();

  return document ? toCreature(document) : null;
}

export async function createCreature(input: Creature) {
  await connectToMongo();
  await CreatureModel.create(input);

  return input;
}

export async function updateCreature(id: string, input: Creature) {
  await connectToMongo();

  const document = await CreatureModel.findOneAndUpdate({ id }, input, {
    projection: { _id: 0 },
    returnDocument: "after",
    runValidators: true,
  })
    .lean()
    .exec();

  return document ? toCreature(document) : null;
}

export async function deleteCreature(id: string) {
  await connectToMongo();

  const result = await CreatureModel.deleteOne({ id }).exec();

  return result.deletedCount > 0;
}
