import type { CombatLogEntry } from "@/lib/schemas/encounter";

export function getLatestCombatLogBatch(entries: readonly CombatLogEntry[]) {
  const latestBatchId = entries.find((entry) => entry.batchId)?.batchId;
  const entriesToHighlight = latestBatchId
    ? entries.filter((entry) => entry.batchId === latestBatchId)
    : entries.slice(0, 1);
  const highlightedEntryIds = new Set(entriesToHighlight.map((entry) => entry.id));
  const hasTargetAc = entriesToHighlight.some((entry) => entry.targetAc !== undefined);
  const damageTotal = entriesToHighlight.reduce((total, entry) => total + (entry.damage?.total ?? 0), 0);

  return {
    latestBatchId,
    highlightedEntryIds,
    hasTargetAc,
    damageTotal,
  };
}
