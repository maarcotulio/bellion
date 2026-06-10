import { z } from "zod";

import { CreatureSchema } from "@/lib/schemas/creature";
import { EncounterSchema } from "@/lib/schemas/encounter";

export const RoyalBellionBackupSchema = z
  .object({
    version: z.literal(1),
    exportedAt: z.string().datetime({ offset: true }),
    data: z
      .object({
        creatures: z.array(CreatureSchema),
        encounters: z.array(EncounterSchema),
      })
      .strict(),
  })
  .strict();

export type RoyalBellionBackup = z.infer<typeof RoyalBellionBackupSchema>;
