import { z } from "zod";

import { CreatureSchema } from "@/lib/schemas/creature";

export function createCreatureId() {
  return crypto.randomUUID();
}

export function normalizeCreatureInput(input: unknown) {
  const now = new Date().toISOString();
  const candidate = z
    .object({
      name: z.string().min(1),
    })
    .passthrough()
    .parse(input);

  return CreatureSchema.parse({
    ...candidate,
    id: createCreatureId(),
    source: candidate.source ?? "manual",
    createdAt: candidate.createdAt ?? now,
    updatedAt: now,
  });
}

export function normalizeCreatureUpdate(id: string, input: unknown) {
  const now = new Date().toISOString();
  const candidate = z
    .object({
      createdAt: z.string().datetime({ offset: true }).optional(),
    })
    .passthrough()
    .parse(input);

  return CreatureSchema.parse({
    ...candidate,
    id,
    updatedAt: now,
  });
}

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "<root>",
    message: issue.message,
  }));
}
