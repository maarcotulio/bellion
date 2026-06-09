import { z } from "zod";

import { EncounterSchema } from "@/lib/schemas/encounter";

export function createEncounterId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeEncounterInput(input: unknown) {
  const now = new Date().toISOString();
  const candidate = z
    .object({
      id: z.string().min(1).optional(),
      name: z.string().min(1),
    })
    .passthrough()
    .parse(input);

  return EncounterSchema.parse({
    ...candidate,
    id: candidate.id ?? createEncounterId(candidate.name),
    log: candidate.log ?? [],
    createdAt: candidate.createdAt ?? now,
    updatedAt: now,
  });
}

export function normalizeEncounterUpdate(id: string, input: unknown) {
  const now = new Date().toISOString();
  const candidate = z
    .object({
      createdAt: z.string().datetime({ offset: true }).optional(),
    })
    .passthrough()
    .parse(input);

  return EncounterSchema.parse({
    ...candidate,
    id,
    updatedAt: now,
  });
}

export function formatEncounterZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "<root>",
    message: issue.message,
  }));
}
